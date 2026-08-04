<script lang="ts" setup>
import type { HrmEmployeeTrainingExperienceApi } from '#/api/hrm/employee/training-experience';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createEmployeeTrainingExperience,
  updateEmployeeTrainingExperience,
} from '#/api/hrm/employee/training-experience';
import { $t } from '#/locales';

import { useTrainingFormSchema } from '../../data';

defineOptions({ name: 'HrmEmployeeTrainingForm' });

const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112 },
  layout: 'horizontal',
  schema: useTrainingFormSchema(),
  showDefaultActions: false,
});

const title = computed(() =>
  editingId.value ? '修改培训经历' : '新增培训经历',
);

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const data = await formApi.getValues();
      await (editingId.value
        ? updateEmployeeTrainingExperience({
            ...data,
            id: editingId.value,
            employeeId: employeeId.value,
          })
        : createEmployeeTrainingExperience({
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
  row?: HrmEmployeeTrainingExperienceApi.EmployeeTrainingExperience,
) {
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
