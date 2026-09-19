<script lang="ts" setup>
import type { OaOvertimeApi } from '#/api/oa/overtime';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createOvertimeApply,
  getOvertimeApply,
  updateOvertimeApply,
} from '#/api/oa/overtime';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaOvertimeApi.OvertimeApply>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['加班申请'])
    : $t('ui.actionTitle.create', ['加班申请']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  /** 按申请起止时间计算天数 */
  handleValuesChange(values, fieldsChanged) {
    if (
      !fieldsChanged.includes('startTime') &&
      !fieldsChanged.includes('endTime')
    ) {
      return;
    }
    if (!values.startTime || !values.endTime) {
      formApi.setFieldValue('days', undefined);
      return;
    }
    // 按整数毫秒保留一位小数，与后端 HALF_UP 一致（0.15 天为 0.2 天）
    const duration = Number(values.endTime) - Number(values.startTime);
    formApi.setFieldValue('days', Math.round(duration / 8_640_000) / 10);
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as OaOvertimeApi.OvertimeApply;
    try {
      await (formData.value?.id
        ? updateOvertimeApply(data)
        : createOvertimeApply(data));
      // 关闭并提示
      await modalApi.close();
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
    const data = modalApi.getData() as OaOvertimeApi.OvertimeApply;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getOvertimeApply(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[800px]">
    <Form class="mx-4" />
  </Modal>
</template>
