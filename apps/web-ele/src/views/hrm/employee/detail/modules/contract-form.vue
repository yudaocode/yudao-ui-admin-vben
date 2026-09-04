<script lang="ts" setup>
import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createEmployeeContract,
  updateEmployeeContract,
} from '#/api/hrm/employee/contract';
import { $t } from '#/locales';
import {
  HrmEmployeeContractStatus,
  HrmEmployeeContractType,
} from '#/views/hrm/utils/constants';

import { useContractFormSchema } from '../../data';

const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useContractFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  handleValuesChange(values, fieldsChanged) {
    if (
      fieldsChanged.includes('type') &&
      values.type === HrmEmployeeContractType.NON_FIXED_TERM_LABOR_CONTRACT
    ) {
      formApi.setFieldValue('term', undefined);
    }
  },
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
        : createEmployeeContract({
            ...data,
            employeeId: employeeId.value,
          }));
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
      row?: HrmEmployeeContractApi.EmployeeContract;
    };
    employeeId.value = currentEmployeeId;
    editingId.value = row?.id;
    modalApi.setState({ title: editingId.value ? '修改合同' : '新增合同' });
    await formApi.reset();
    await formApi.setValues({
      sort: 1,
      type: HrmEmployeeContractType.FIXED_TERM_LABOR_CONTRACT,
      term: 1,
      status: HrmEmployeeContractStatus.NOT_PERFORMED,
      expireRemind: false,
      ...row,
      employeeId: currentEmployeeId,
      fileUrls: row?.fileUrls ?? [],
    });
  },
});
</script>

<template>
  <Modal class="w-[760px]">
    <Form class="mx-4" />
  </Modal>
</template>
