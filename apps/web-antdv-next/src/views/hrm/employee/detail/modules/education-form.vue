<script lang="ts" setup>
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createEmployeeEducationExperience,
  updateEmployeeEducationExperience,
} from '#/api/hrm/employee/education-experience';
import { $t } from '#/locales';

import { useEducationFormSchema } from '../../data';

defineOptions({ name: 'HrmEmployeeEducationForm' });

const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112 },
  layout: 'horizontal',
  schema: useEducationFormSchema(),
  showDefaultActions: false,
});

const title = computed(() =>
  editingId.value ? '修改教育经历' : '新增教育经历',
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues();
      await (editingId.value
        ? updateEmployeeEducationExperience({
            ...data,
            id: editingId.value,
            employeeId: employeeId.value,
          })
        : createEmployeeEducationExperience({
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
});

function open(
  empId: number,
  row?: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience,
) {
  employeeId.value = empId;
  editingId.value = row?.id;
  modalApi.setState({ title: title.value });
  formApi.resetForm();
  formApi.setValues({ sort: 1, firstDegree: false, ...row, employeeId: empId });
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal :title="title" class="w-[680px]">
    <Form class="mx-4" />
  </Modal>
</template>
