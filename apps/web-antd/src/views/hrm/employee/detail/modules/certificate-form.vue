<script lang="ts" setup>
import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createEmployeeCertificate,
  updateEmployeeCertificate,
} from '#/api/hrm/employee/certificate';
import { $t } from '#/locales';

import { useCertificateFormSchema } from '../../data';

defineOptions({ name: 'HrmEmployeeCertificateForm' });

const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112 },
  layout: 'horizontal',
  schema: useCertificateFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues();
      await (editingId.value
        ? updateEmployeeCertificate({
            ...data,
            id: editingId.value,
            employeeId: employeeId.value,
          })
        : createEmployeeCertificate({
            ...data,
            employeeId: employeeId.value,
          }));
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
      row?: HrmEmployeeCertificateApi.EmployeeCertificate;
    };
    employeeId.value = currentEmployeeId;
    editingId.value = row?.id;
    modalApi.setState({ title: editingId.value ? '修改证书' : '新增证书' });
    await formApi.reset();
    await formApi.setValues({
      sort: 1,
      ...row,
      employeeId: currentEmployeeId,
    });
  },
});
</script>

<template>
  <Modal class="w-[680px]">
    <Form class="mx-4" />
  </Modal>
</template>
