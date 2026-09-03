<script lang="ts" setup>
import type { PmsWorkItemWorkLogApi } from '#/api/pms/pm/workitem/worklog';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import {
  createWorkItemWorkLog,
  getWorkItemWorkLog,
  updateWorkItemWorkLog,
} from '#/api/pms/pm/workitem/worklog';

import { useWorkLogFormSchema } from './data';

defineOptions({ name: 'PmsWorkItemWorkLogForm' });

const emit = defineEmits<{ success: [] }>(); // 定义 success 事件，用于提交成功后的回调

const formData = ref<PmsWorkItemWorkLogApi.WorkItemWorkLog>(); // 表单数据
const currentRemainingHours = ref(0); // 打开时工作项的剩余工时

const getTitle = computed(() => (formData.value?.id ? '编辑工时' : '登记工时'));

/** 根据投入工时建议剩余工时 */
async function handleActualHoursChange(actualHours?: number) {
  if (formData.value?.id) {
    return;
  }
  await formApi.setFieldValue(
    'remainingHours',
    Math.max(currentRemainingHours.value - (actualHours ?? 0), 0),
  );
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 96,
  },
  layout: 'horizontal',
  schema: useWorkLogFormSchema(handleActualHoursChange),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const values = await formApi.getValues();
    const data: PmsWorkItemWorkLogApi.WorkItemWorkLog = {
      id: formData.value?.id,
      workItemId: formData.value?.workItemId ?? 0,
      actualHours: values.actualHours,
      remainingHours: values.remainingHours,
      description: values.description,
    };
    try {
      await (formData.value?.id
        ? updateWorkItemWorkLog(data)
        : createWorkItemWorkLog(data));
      await modalApi.close();
      emit('success');
      ElMessage.success(formData.value?.id ? '更新成功' : '登记成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    const data = modalApi.getData() as {
      id?: number;
      remainingHours?: number;
      workItemId: number;
    };
    currentRemainingHours.value = data.remainingHours ?? 0;
    if (!data.id) {
      formData.value = {
        workItemId: data.workItemId,
        actualHours: 1,
        remainingHours: 0,
        description: '',
      };
      await formApi.setValues({
        actualHours: 1,
        remainingHours: Math.max(currentRemainingHours.value - 1, 0),
        description: '',
      });
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getWorkItemWorkLog(data.id);
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
