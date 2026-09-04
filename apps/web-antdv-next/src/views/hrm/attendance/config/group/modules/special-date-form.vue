<script lang="ts" setup>
import type { HrmAttendanceGroupApi } from '#/api/hrm/attendance/group';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';

import { useSpecialDateFormSchema } from '../data';

defineOptions({ name: 'HrmAttendanceGroupSpecialDateForm' });

const emit = defineEmits<{
  confirm: [specialDate: HrmAttendanceGroupApi.SpecialDate, index?: number];
}>();
const editIndex = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 104 },
  layout: 'horizontal',
  schema: useSpecialDateFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    emit(
      'confirm',
      { ...values, date: Number(values.date) } as any,
      editIndex.value,
    );
    await modalApi.close();
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { index, specialDate } = modalApi.getData() as any;
    editIndex.value = index;
    modalApi.setState({
      title: index === undefined ? '新增特殊日期' : '编辑特殊日期',
    });
    await formApi.reset();
    if (specialDate) await formApi.setValues(specialDate);
  },
});
</script>

<template>
  <Modal class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
