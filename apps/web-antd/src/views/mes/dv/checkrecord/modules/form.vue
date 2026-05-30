<script lang="ts" setup>
import type { FormType } from '../data';

import type { MesDvCheckRecordApi } from '#/api/mes/dv/checkrecord';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { MesDvCheckRecordStatusEnum } from '@vben/constants';

import { Button, message, Popconfirm } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createCheckRecord,
  getCheckRecord,
  submitCheckRecord,
  updateCheckRecord,
} from '#/api/mes/dv/checkrecord';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import LineList from './line-list.vue';

const emit = defineEmits(['success']);
const formType = ref<FormType>('create');
const formData = ref<MesDvCheckRecordApi.CheckRecord>();
const isDetail = computed(() => formType.value === 'detail');
const canSubmit = computed(
  () => formType.value === 'update' && formData.value?.status === MesDvCheckRecordStatusEnum.DRAFT,
);
const getTitle = computed(() => {
  if (formType.value === 'detail') {
    return '查看点检记录';
  }
  return formType.value === 'update' ? '修改点检记录' : '新增点检记录';
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

/** 提交点检记录 */
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid || !formData.value?.id) {
    return;
  }

  modalApi.lock();
  try {
    await updateCheckRecord((await formApi.getValues()) as MesDvCheckRecordApi.CheckRecord);
    await submitCheckRecord(formData.value.id);
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
    const data = (await formApi.getValues()) as MesDvCheckRecordApi.CheckRecord;
    try {
      if (formType.value === 'create') {
        const id = await createCheckRecord(data);
        formData.value = { ...data, id: id as number, status: MesDvCheckRecordStatusEnum.DRAFT };
        await formApi.setFieldValue('id', id);
        formType.value = 'update';
      } else {
        await updateCheckRecord(data);
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
    // 加载数据
    const data = modalApi.getData<{ formType: FormType; id?: number }>();
    formType.value = data.formType;
    formApi.setDisabled(formType.value === 'detail');
    modalApi.setState({ showConfirmButton: formType.value !== 'detail' });
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getCheckRecord(data.id);
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
          title="确认提交该点检记录？提交后将不能修改。"
          @confirm="handleSubmit"
        >
          <Button type="primary">提交</Button>
        </Popconfirm>
      </div>
    </template>
  </Modal>
</template>
