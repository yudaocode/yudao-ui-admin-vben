<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createMyAttendanceLeave } from '#/api/hrm/portal/attendance/leave';

import { useLeaveFormSchema } from '../data';

defineOptions({ name: 'HrmPortalAttendanceLeaveForm' });

const emit = defineEmits<{
  success: [];
}>();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 88 },
  layout: 'horizontal',
  schema: useLeaveFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await submitForm();
  },
  onOpenChange(isOpen) {
    if (isOpen) formApi.reset();
  },
  title: '请假申请',
});

/** 提交表单 */
async function submitForm() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  modalApi.lock();
  try {
    const values = await formApi.getValues();
    await createMyAttendanceLeave({
      ...values,
      startTime: Number(values.startTime),
      endTime: Number(values.endTime),
    });
    message.success('请假申请已提交');
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
