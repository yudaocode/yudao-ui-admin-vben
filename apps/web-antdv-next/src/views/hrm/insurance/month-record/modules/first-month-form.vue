<script lang="ts" setup>
import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { createFirstInsuranceMonthRecord } from '#/api/hrm/insurance/month-record';

defineOptions({ name: 'HrmInsuranceFirstMonthForm' });

const emit = defineEmits<{ success: [year: number] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 104,
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'yearMonth',
      label: '社保月份',
      component: 'DatePicker',
      rules: 'required',
      componentProps: {
        picker: 'month',
        format: 'YYYY-MM',
        valueFormat: 'YYYY-MM',
        placeholder: '请选择社保月份',
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      const { yearMonth } = await formApi.getValues();
      const parsed = dayjs(String(yearMonth), 'YYYY-MM');
      await createFirstInsuranceMonthRecord({
        year: parsed.year(),
        month: parsed.month() + 1,
      });
      message.success('创建成功');
      emit('success', parsed.year());
      await modalApi.close();
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await formApi.resetForm();
    modalApi.setState({ title: '新建首月社保表' });
  },
});

defineExpose({
  open: () => modalApi.open(),
});
</script>

<template>
  <Modal class="w-[500px]">
    <Form class="mx-4" />
  </Modal>
</template>
