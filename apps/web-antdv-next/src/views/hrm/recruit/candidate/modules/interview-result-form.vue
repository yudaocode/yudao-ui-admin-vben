<script lang="ts" setup>
import type { HrmRecruitInterviewApi } from '#/api/hrm/recruit/interview';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { updateRecruitInterviewResult } from '#/api/hrm/recruit/interview';
import { $t } from '#/locales';
import { HrmRecruitInterviewResult } from '#/views/hrm/utils/constants';

import { useInterviewResultFormSchema } from '../data';

const emit = defineEmits(['success']);
const cancelMode = ref(false);
const interviewId = ref(0);
const getTitle = computed(() =>
  cancelMode.value ? '取消面试' : '登记面试结果',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useInterviewResultFormSchema(false),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const values = await formApi.getValues();
    const result = cancelMode.value
      ? HrmRecruitInterviewResult.CANCELED
      : values.result;
    const canceled = result === HrmRecruitInterviewResult.CANCELED;
    try {
      await updateRecruitInterviewResult({
        id: interviewId.value,
        result,
        evaluate: canceled ? '' : values.evaluate,
        cancelReason: canceled ? values.cancelReason : '',
      });
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      cancelMode.value = false;
      interviewId.value = 0;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{
      interview: HrmRecruitInterviewApi.RecruitInterview;
      result?: number;
    }>();
    if (!data?.interview?.id) {
      return;
    }
    const result = data.result ?? HrmRecruitInterviewResult.PASS;
    cancelMode.value = result === HrmRecruitInterviewResult.CANCELED;
    interviewId.value = data.interview.id;
    formApi.setState({
      schema: useInterviewResultFormSchema(cancelMode.value),
    });
    await formApi.setValues({
      result,
      evaluate: data.interview.evaluate ?? '',
      cancelReason: data.interview.cancelReason ?? '',
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[640px]">
    <Form class="mx-4" />
  </Modal>
</template>
