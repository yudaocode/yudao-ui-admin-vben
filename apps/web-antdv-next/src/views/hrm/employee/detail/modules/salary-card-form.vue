<script lang="ts" setup>
import type { HrmEmployeeSalaryCardApi } from '#/api/hrm/employee/salary-card';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { saveEmployeeSalaryCard } from '#/api/hrm/employee/salary-card';
import { $t } from '#/locales';

import { useSalaryCardFormSchema } from '../../data';
const emit = defineEmits(['success']);
const employeeId = ref<number>();
const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useSalaryCardFormSchema(),
  showDefaultActions: false,
});
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      await saveEmployeeSalaryCard({
        ...(await formApi.getValues()),
        employeeId: employeeId.value,
      });
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
function open(
  empId: number,
  row?: HrmEmployeeSalaryCardApi.EmployeeSalaryCard,
) {
  employeeId.value = empId;
  formApi.resetForm();
  formApi.setValues({ ...row, employeeId: empId });
  modalApi.setState({ title: '编辑工资卡' });
  modalApi.open();
}
defineExpose({ open });
</script>
<template>
  <Modal class="w-[560px]"><Form class="mx-4" /></Modal>
</template>
