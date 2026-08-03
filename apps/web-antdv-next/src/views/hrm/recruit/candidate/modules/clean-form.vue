<script lang="ts" setup>
import { computed } from 'vue';

import { confirm, useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  eliminateRecruitCandidate,
  getCleanRecruitCandidateIdList,
} from '#/api/hrm/recruit/candidate';
import { executeBatch } from '#/views/hrm/utils/batch';
import { HrmRecruitCandidateStatus } from '#/views/hrm/utils/constants';

import { useCleanFormSchema } from '../data';

const emit = defineEmits(['success']);
const getTitle = computed(() => '一键清理候选人');
const cleanStatuses = [
  HrmRecruitCandidateStatus.NEW,
  HrmRecruitCandidateStatus.PRIMARY_PASS,
  HrmRecruitCandidateStatus.INTERVIEW,
  HrmRecruitCandidateStatus.INTERVIEW_PASS,
];

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 112,
  },
  layout: 'horizontal',
  schema: useCleanFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  confirmText: '确认清理',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const values = await formApi.getValues();
    try {
      const ids = await getCleanRecruitCandidateIdList(
        values.statuses,
        values.days,
      );
      if (ids.length === 0) {
        message.warning('暂无可清理候选人');
        return;
      }
      await confirm(`确认将 ${ids.length} 位候选人移至已淘汰状态吗？`);
      const hasSuccess = await executeBatch(
        ids.map((id) =>
          eliminateRecruitCandidate({
            id,
            eliminate: '长期未跟进',
            remark: `状态持续 ${values.days} 天，由一键清理操作淘汰`,
          }),
        ),
      );
      if (!hasSuccess) {
        return;
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
    } catch {
      // 取消确认
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    await formApi.setValues({
      statuses: [...cleanStatuses],
      days: 30,
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
