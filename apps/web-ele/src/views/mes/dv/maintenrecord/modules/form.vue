<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesDvMaintenRecordApi } from '#/api/mes/dv/maintenrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesDvMaintenRecordStatusEnum } from '@vben/constants';
import { useUserStore } from '@vben/stores';

import { ElButton, ElMessage, ElPopconfirm } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createMaintenRecord,
  getMaintenRecord,
  submitMaintenRecord,
  updateMaintenRecord,
} from '#/api/mes/dv/maintenrecord';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const userStore = useUserStore();
const formType = ref<FormType>('create');
const formData = ref<MesDvMaintenRecordApi.MaintenRecord>();
const isDetail = computed(() => formType.value === 'detail');
const canSubmit = computed(
  () =>
    formType.value === 'update' && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看保养记录';
  }
  return formType.value === 'update' ? '修改保养记录' : '新增保养记录';
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-3',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

/** 提交保养记录 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }

  modalApi.lock();
  try {
    await updateMaintenRecord((await formApi.getValues()) as MesDvMaintenRecordApi.MaintenRecord);
    await submitMaintenRecord(formData.value.id);
    await modalApi.close();
    emit('success');
    ElMessage.success('提交成功');
  } finally {
    modalApi.unlock();
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (isDetail.value) {
      await modalApi.close();
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesDvMaintenRecordApi.MaintenRecord;
    try {
      if (formType.value === 'create') {
        const id = await createMaintenRecord(data);
        formData.value = {
          ...data,
          id: id as number,
          status: MesDvMaintenRecordStatusEnum.PREPARE,
        };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateMaintenRecord(data);
        formData.value = { ...formData.value, ...data };
      }
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      await formApi.setFieldValue('userId', userStore.userInfo?.id);
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getMaintenRecord(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>
<template>
  <Modal :title="getTitle" class="w-4/5">
    <Form class="mx-4" />
    <LineList v-if="formData?.id" :disabled="isDetail" :record-id="formData.id" />
    <template #prepend-footer>
      <div class="flex flex-auto items-center">
        <ElPopconfirm
          v-if="canSubmit"
          title="确认提交该保养记录？提交后将不能修改。"
          @confirm="handleSubmit"
        >
          <template #reference>
            <ElButton type="primary">提交</ElButton>
          </template>
        </ElPopconfirm>
      </div>
    </template>
  </Modal>
</template>
