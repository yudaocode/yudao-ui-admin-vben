<script lang="ts" setup>
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

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
      row?: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience;
    };
    employeeId.value = currentEmployeeId;
    editingId.value = row?.id;
    modalApi.setState({
      title: editingId.value ? '修改教育经历' : '新增教育经历',
    });
    await formApi.reset();
    await formApi.setValues({
      sort: 1,
      firstDegree: false,
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
