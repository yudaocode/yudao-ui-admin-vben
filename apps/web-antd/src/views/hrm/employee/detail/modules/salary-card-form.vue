<script lang="ts" setup>
import type { HrmEmployeeSalaryCardApi } from '#/api/hrm/employee/salary-card';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { saveEmployeeSalaryCard } from '#/api/hrm/employee/salary-card';
import { $t } from '#/locales';

import { useSalaryCardFormSchema } from '../../data';

const emit = defineEmits(['success']);
const employeeId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 112,
    componentProps: { class: 'w-full' },
  },
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
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { employeeId: currentEmployeeId, row } = modalApi.getData() as {
      employeeId: number;
      row?: HrmEmployeeSalaryCardApi.EmployeeSalaryCard;
    };
    employeeId.value = currentEmployeeId;
    await formApi.reset();
    await formApi.setValues({ ...row, employeeId: currentEmployeeId });
  },
});
</script>

<template>
  <Modal title="编辑工资卡" class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
