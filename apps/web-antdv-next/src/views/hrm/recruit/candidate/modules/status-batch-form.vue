<script lang="ts" setup>
import type { HrmRecruitCandidateStatusValue } from '#/views/hrm/utils/constants';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { updateRecruitCandidateStatus } from '#/api/hrm/recruit/candidate';
import { executeBatch } from '#/views/hrm/utils/batch';

import { useStatusBatchFormSchema } from '../data';

const emit = defineEmits(['success']);
const candidateIds = ref<number[]>([]);
const sourceStatus = ref<HrmRecruitCandidateStatusValue>();
const getTitle = computed(() => '批量流转候选人');

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: useStatusBatchFormSchema(),
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
    try {
      const hasSuccess = await executeBatch(
        candidateIds.value.map((id) =>
          updateRecruitCandidateStatus({ id, status: values.status }),
        ),
      );
      if (!hasSuccess) {
        return;
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
      candidateIds.value = [];
      sourceStatus.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<{
      ids: number[];
      status: HrmRecruitCandidateStatusValue;
    }>();
    if (!data) {
      return;
    }
    candidateIds.value = [...data.ids];
    sourceStatus.value = data.status;
    formApi.setState({
      schema: useStatusBatchFormSchema(data.status),
    });
    await formApi.setValues({
      candidateCount: `${candidateIds.value.length} 人`,
      status: undefined,
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
