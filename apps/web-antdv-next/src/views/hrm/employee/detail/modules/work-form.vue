<script lang="ts" setup>
import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createEmployeeWorkExperience,
  updateEmployeeWorkExperience,
} from '#/api/hrm/employee/work-experience';
import { $t } from '#/locales';

import { useWorkFormSchema } from '../../data';

defineOptions({ name: 'HrmEmployeeWorkForm' });

const emit = defineEmits(['success']);
const employeeId = ref<number>();
const editingId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112 },
  layout: 'horizontal',
  schema: useWorkFormSchema(),
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
        ? updateEmployeeWorkExperience({
            ...data,
            id: editingId.value,
            employeeId: employeeId.value,
          })
        : createEmployeeWorkExperience({
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
      row?: HrmEmployeeWorkExperienceApi.EmployeeWorkExperience;
    };
    employeeId.value = currentEmployeeId;
    editingId.value = row?.id;
    modalApi.setState({
      title: editingId.value ? '修改工作经历' : '新增工作经历',
    });
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
