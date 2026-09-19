<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { addPlanComment } from '#/api/oa/plan';

import { useCommentFormSchema } from '../data';

const emit = defineEmits(['success']);
const planId = ref<number>(); // 工作计划编号

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useCommentFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交点评
    try {
      const { comment } = await formApi.getValues();
      await addPlanComment(planId.value!, comment.trim());
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success('点评成功');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      planId.value = undefined;
      return;
    }
    const data = modalApi.getData() as { id: number };
    planId.value = data?.id;
  },
});
</script>

<template>
  <Modal title="点评工作计划" class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
