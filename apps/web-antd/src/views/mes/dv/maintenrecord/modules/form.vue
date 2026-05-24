<script lang="ts" setup>
import type { MesDvMaintenRecordApi } from '#/api/mes/dv/maintenrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { Button, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createMaintenRecord,
  getMaintenRecord,
  submitMaintenRecord,
  updateMaintenRecord,
} from '#/api/mes/dv/maintenrecord';
import { $t } from '#/locales';
import { MesDvMaintenRecordStatusEnum } from '#/views/mes/utils/constants';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

type FormMode = 'create' | 'detail' | 'update';

const emit = defineEmits(['success']);
const userStore = useUserStore();
const formMode = ref<FormMode>('create');
const formData = ref<MesDvMaintenRecordApi.MaintenRecord>();
const isDetail = computed(() => formMode.value === 'detail');
const canSubmit = computed(
  () =>
    formMode.value === 'update' && formData.value?.status === MesDvMaintenRecordStatusEnum.PREPARE,
);
const getTitle = computed(
  () =>
    ({ create: '新增保养记录', update: '修改保养记录', detail: '查看保养记录' })[formMode.value],
);

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
    message.success('提交成功');
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
      if (formMode.value === 'create') {
        const id = await createMaintenRecord(data);
        formData.value = {
          ...data,
          id: id as number,
          status: MesDvMaintenRecordStatusEnum.PREPARE,
        };
        await formApi.setFieldValue('id', id);
        formMode.value = 'update';
      } else {
        await updateMaintenRecord(data);
        formData.value = { ...formData.value, ...data };
      }
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    await formApi.resetForm();
    // 加载数据
    const data = modalApi.getData<{ id?: number; type?: FormMode }>();
    formMode.value = data?.type || 'create';
    formApi.setDisabled(formMode.value === 'detail');
    modalApi.setState({ showConfirmButton: formMode.value !== 'detail' });
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
        <Popconfirm
          v-if="canSubmit"
          title="确认提交该保养记录？提交后将不能修改。"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
