<script lang="ts" setup>
import type { HrmHomeApi } from '#/api/hrm/home';

import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';

import { Card } from 'antdv-next';
import dayjs from 'dayjs';

import { HrmRecruitCandidateStatus } from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmHomeRecruitSurvey' });

const props = defineProps<{
  survey?: HrmHomeApi.HrHomeRecruitSurvey;
}>();

type RecruitAction = 'joined' | 'pending-entry' | 'post';

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const canQueryRecruitPost = hasAccessByCodes(['hrm:recruit:post:query']);
const canQueryRecruitCandidate = hasAccessByCodes([
  'hrm:recruit:candidate:query',
]);
const recruitRange = `${dayjs().subtract(6, 'month').format('YYYY.MM.DD')}-${dayjs().format(
  'YYYY.MM.DD',
)}`;

const surveyItems = computed(() => [
  {
    action: 'post' as RecruitAction,
    disabled: !canQueryRecruitPost,
    label: '正在招聘职位',
    value: props.survey?.recruitingPostCount || 0,
  },
  {
    action: undefined,
    disabled: true,
    label: '评选中',
    value: props.survey?.candidateInProcessCount || 0,
  },
  {
    action: 'pending-entry' as RecruitAction,
    disabled: !canQueryRecruitCandidate,
    label: '待入职',
    value: props.survey?.pendingEntryCount || 0,
  },
  {
    action: 'joined' as RecruitAction,
    disabled: !canQueryRecruitCandidate,
    label: '已入职',
    value: props.survey?.joinedCount || 0,
  },
]);

/** 打开招聘动态对应的列表 */
function goRecruitSurvey(action?: RecruitAction) {
  if (action === 'post' && canQueryRecruitPost) {
    router.push({ name: 'HrmRecruitPost' });
  } else if (action === 'pending-entry' && canQueryRecruitCandidate) {
    router.push({
      name: 'HrmRecruitCandidate',
      query: { status: HrmRecruitCandidateStatus.PENDING_ENTRY },
    });
  } else if (action === 'joined' && canQueryRecruitCandidate) {
    router.push({
      name: 'HrmRecruitCandidate',
      query: { status: HrmRecruitCandidateStatus.JOINED },
    });
  }
}
</script>

<template>
  <Card :title="`招聘动态（${recruitRange}）`">
    <div class="grid grid-cols-4">
      <button
        v-for="(item, index) in surveyItems"
        :key="item.label"
        :disabled="item.disabled"
        class="flex min-h-[88px] flex-col items-center justify-center border-0 bg-transparent"
        :class="[
          item.disabled ? 'cursor-default' : 'group cursor-pointer',
          index < surveyItems.length - 1
            ? 'border-border border-r border-solid'
            : '',
        ]"
        type="button"
        @click="goRecruitSurvey(item.action)"
      >
        <strong class="text-[24px] leading-8 group-hover:text-primary">
          {{ item.value }}
        </strong>
        <span
          class="text-muted-foreground mt-2 text-[13px] group-hover:text-primary"
        >
          {{ item.label }}
        </span>
      </button>
    </div>
  </Card>
</template>
