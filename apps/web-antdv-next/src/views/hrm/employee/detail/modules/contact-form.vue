<script lang="ts" setup>
import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createEmployeeContact,
  updateEmployeeContact,
} from '#/api/hrm/employee/contact';
import { $t } from '#/locales';

import { useContactFormSchema } from '../../data';

defineOptions({ name: 'HrmEmployeeContactForm' });

const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112 },
  layout: 'horizontal',
  schema: useContactFormSchema(),
  showDefaultActions: false,
});

const title = computed(() => (editingId.value ? '修改联系人' : '新增联系人'));

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues();
      await (editingId.value
        ? updateEmployeeContact({
            ...data,
            id: editingId.value,
            employeeId: employeeId.value,
          })
        : createEmployeeContact({ ...data, employeeId: employeeId.value }));
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});

function open(empId: number, row?: HrmEmployeeContactApi.EmployeeContact) {
  employeeId.value = empId;
  editingId.value = row?.id;
  modalApi.setState({ title: title.value });
  formApi.resetForm();
  formApi.setValues({ sort: 1, ...row, employeeId: empId });
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal :title="title" class="w-[680px]">
    <Form class="mx-4" />
  </Modal>
</template>
