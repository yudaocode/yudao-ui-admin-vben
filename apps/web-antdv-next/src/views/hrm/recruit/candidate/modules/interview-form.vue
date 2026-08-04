<script lang="ts" setup>
import type { HrmRecruitInterviewApi } from '#/api/hrm/recruit/interview';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createRecruitInterview,
  updateRecruitInterview,
} from '#/api/hrm/recruit/interview';
import { $t } from '#/locales';
import { executeBatch } from '#/views/hrm/utils/batch';
import { HrmRecruitInterviewType } from '#/views/hrm/utils/constants';

import { useInterviewFormSchema } from '../data';

const emit = defineEmits(['success']);

type FormType = 'batch' | 'create' | 'update';

const formType = ref<FormType>('create');
const candidateIds = ref<number[]>([]);
const dialogTitle = ref('安排面试');
const interviewId = ref<number>();

const getTitle = computed(() => dialogTitle.value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useInterviewFormSchema(),
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
    const payload: HrmRecruitInterviewApi.RecruitInterview = {
      id: interviewId.value,
      type: values.type,
      interviewTime: values.interviewTime
        ? Number(values.interviewTime)
        : undefined,
      interviewEmployeeId: values.interviewEmployeeId,
      otherInterviewEmployeeIds: values.otherInterviewEmployeeIds ?? [],
      address: values.address,
      remark: values.remark,
    };
    try {
      if (formType.value === 'update') {
        await updateRecruitInterview(payload);
        message.success($t('ui.actionMessage.operationSuccess'));
      } else if (formType.value === 'batch') {
        const hasSuccess = await executeBatch(
          candidateIds.value.map((candidateId) =>
            createRecruitInterview({ ...payload, candidateId }),
          ),
        );
        if (!hasSuccess) {
          return;
        }
      } else {
        await createRecruitInterview({
          ...payload,
          candidateId: candidateIds.value[0],
        });
        message.success($t('ui.actionMessage.operationSuccess'));
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formType.value = 'create';
      candidateIds.value = [];
      interviewId.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{
      candidateIdOrIds: number | number[];
      createTitle?: string;
      interview?: HrmRecruitInterviewApi.RecruitInterview;
      type: FormType;
    }>();
    if (!data) {
      return;
    }
    formType.value = data.type;
    candidateIds.value = Array.isArray(data.candidateIdOrIds)
      ? [...data.candidateIdOrIds]
      : [data.candidateIdOrIds];
    if (data.type === 'update') {
      dialogTitle.value = '更改面试安排';
    } else if (data.type === 'batch') {
      dialogTitle.value = '批量安排面试';
    } else {
      dialogTitle.value = data.createTitle ?? '安排面试';
    }
    interviewId.value = data.interview?.id;
    await formApi.setValues({
      formType: data.type,
      candidateCount: `${candidateIds.value.length} 人`,
      type: data.interview?.type ?? HrmRecruitInterviewType.VIDEO,
      interviewTime: data.interview?.interviewTime
        ? String(Number(data.interview.interviewTime))
        : undefined,
      interviewEmployeeId: data.interview?.interviewEmployeeId,
      otherInterviewEmployeeIds:
        data.interview?.otherInterviewEmployeeIds ?? [],
      address: data.interview?.address ?? '',
      remark: data.interview?.remark ?? '',
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[760px]">
    <Form class="mx-4" />
  </Modal>
</template>
