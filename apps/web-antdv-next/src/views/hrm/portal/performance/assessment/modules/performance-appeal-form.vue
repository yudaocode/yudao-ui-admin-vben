<script lang="ts" setup>
import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  getPerformanceAssessment,
  submitPerformanceAssessmentAppeal,
} from '#/api/hrm/portal/performance/assessment';
import { FileUpload } from '#/components/upload';
import { HrmPerformanceAssessmentStageStatus } from '#/views/hrm/utils/constants';

import { useAppealFormSchema } from '../data';

defineOptions({ name: 'HrmPortalPerformanceAppealForm' });

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 110 },
  layout: 'horizontal',
  schema: useAppealFormSchema(FileUpload),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    if (!values.assessmentId) return;
    modalApi.lock();
    try {
      await submitPerformanceAssessmentAppeal({
        assessmentId: values.assessmentId as number,
        appealReason: values.appealReason as string,
        appealFileUrls: (values.appealFileUrls || []) as string[],
        reviewStageIds: values.reviewStageIds as number[],
      });
      message.success('绩效申诉已提交');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const assessmentId = (modalApi.getData() as { assessmentId?: number })
      ?.assessmentId;
    if (!assessmentId) {
      await modalApi.close();
      return;
    }
    modalApi.lock();
    try {
      const assessment = await getPerformanceAssessment(assessmentId);
      const completedReviewStages = (assessment.reviewStages || []).filter(
        (stage) =>
          stage.id !== null &&
          stage.id !== undefined &&
          stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED,
      );
      formApi.updateSchema([
        {
          fieldName: 'reviewStageIds',
          componentProps: {
            options: completedReviewStages.map((stage) => ({
              label: stage.handlerName
                ? `${stage.name || '评分阶段'}（${stage.handlerName}）`
                : stage.name || '评分阶段',
              value: stage.id,
            })),
          },
        },
      ]);
      await formApi.resetForm();
      await formApi.setValues({
        assessmentId,
        appealFileUrls: [],
        appealReason: '',
        reviewStageIds: completedReviewStages.at(-1)?.id
          ? [completedReviewStages.at(-1)!.id]
          : [],
      });
    } finally {
      modalApi.unlock();
    }
  },
  title: '提交绩效申诉',
});
</script>

<template>
  <Modal class="w-[680px]">
    <Form class="mx-4" />
  </Modal>
</template>
