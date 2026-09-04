<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  addPerformancePlanEmployees,
  getPerformancePlanUnassignedEmployeeIdList,
} from '#/api/hrm/performance/assessment';

import { useAssessmentAddFormSchema } from '../data';

defineOptions({ name: 'HrmPerformancePlanAssessmentAddForm' });

const emit = defineEmits<{ success: [] }>();
const planId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 90,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !planId.value) return;
    modalApi.lock();
    try {
      const { employeeIds } = await formApi.getValues();
      await addPerformancePlanEmployees({
        employeeIds,
        planId: planId.value,
      });
      await modalApi.close();
      emit('success');
      message.success('参评员工添加成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      planId.value = undefined;
      return;
    }
    planId.value = Number(modalApi.getData());
    modalApi.lock();
    try {
      const selectableEmployeeIds = new Set(
        await getPerformancePlanUnassignedEmployeeIdList(planId.value),
      );
      await formApi.setState({
        schema: useAssessmentAddFormSchema(selectableEmployeeIds),
      });
      await formApi.resetForm();
    } finally {
      modalApi.unlock();
    }
  },
  title: '添加参评员工',
});
</script>

<template>
  <Modal class="w-[620px]">
    <Form class="mx-4" />
  </Modal>
</template>
