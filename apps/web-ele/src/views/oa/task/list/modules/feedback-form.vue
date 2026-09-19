<script lang="ts" setup>
import type { OaTaskApi } from '#/api/oa/task';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { feedbackTask } from '#/api/oa/task';
import { OA_TASK_STATUS } from '#/views/oa/utils/constants';

import { useFeedbackFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFeedbackFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单，失败时保留输入内容
    const data = (await formApi.getValues()) as OaTaskApi.TaskFeedback;
    try {
      await feedbackTask(data);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success('反馈成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { mode: string; task: OaTaskApi.Task };
    if (!data?.task) {
      return;
    }
    const { mode, task } = data;
    const status =
      (mode === 'published' ? task.status : task.receiverStatus) ??
      OA_TASK_STATUS.NEW;
    // 我的任务反馈时，只允许选择未提交之前的状态
    const options =
      mode === 'published'
        ? getDictOptions(DICT_TYPE.OA_TASK_STATUS, 'number')
        : getDictOptions(DICT_TYPE.OA_TASK_STATUS, 'number').filter(
            (item) =>
              item.value >= OA_TASK_STATUS.NEW &&
              item.value <= OA_TASK_STATUS.SUBMITTED,
          );
    formApi.updateSchema([
      {
        fieldName: 'status',
        componentProps: { options },
      },
    ]);
    // 设置到 values
    await formApi.setValues({
      taskId: task.id,
      publisher: mode === 'published',
      status,
      content: '',
    });
  },
});
</script>

<template>
  <Modal title="新增反馈" class="w-[600px]">
    <Form class="mx-4" />
  </Modal>
</template>
