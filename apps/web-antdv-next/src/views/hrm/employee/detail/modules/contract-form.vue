<script lang="ts" setup>
import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createEmployeeContract,
  updateEmployeeContract,
} from '#/api/hrm/employee/contract';
import { $t } from '#/locales';

import { useContractFormSchema } from '../../data';
const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();
const title = computed(() => (editingId.value ? '修改合同' : '新增合同'));
const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useContractFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues();
      await (editingId.value
        ? updateEmployeeContract({
            ...data,
            id: editingId.value,
            employeeId: employeeId.value,
          })
        : createEmployeeContract({ ...data, employeeId: employeeId.value }));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
function open(empId: number, row?: HrmEmployeeContractApi.EmployeeContract) {
  employeeId.value = empId;
  editingId.value = row?.id;
  modalApi.setState({ title: title.value });
  formApi.resetForm();
  formApi.setValues({ sort: 1, expireRemind: true, ...row, employeeId: empId });
  modalApi.open();
}
defineExpose({ open });
</script>
<template>
  <Modal :title="title" class="w-[760px]"><Form class="mx-4" /></Modal>
</template>
