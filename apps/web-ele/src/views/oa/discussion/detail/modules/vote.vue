<script lang="ts" setup>
import type { OaDiscussionApi } from '#/api/oa/discussion';
import type { OaDiscussionVoteApi } from '#/api/oa/discussion/vote';

import { computed, ref, toRef, watch } from 'vue';

import { formatDate } from '@vben/utils';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElCheckboxGroup,
  ElMessage,
  ElPopover,
  ElProgress,
  ElRadio,
  ElRadioGroup,
  ElTag,
} from 'element-plus';

import { voteDiscussion } from '#/api/oa/discussion/vote';
import { getDiscussionVoteModeName } from '#/views/oa/utils/format';

defineOptions({ name: 'OaDiscussionVote' });

const props = defineProps<{ detail: OaDiscussionApi.Discussion }>();
const emit = defineEmits(['success']); // 投票成功
const detail = toRef(props, 'detail'); // 讨论详情

const selectedOptionIds = ref<number[]>([]); // 多选选项
const selectedOptionId = ref<number>(); // 单选选项
const submitLoading = ref(false); // 投票提交中
const hasVoted = computed(
  () => detail.value?.voteOptions?.some((item) => item.voted) || false,
); // 是否已投票
const votedOptionIds = computed(
  () =>
    detail.value?.voteOptions
      ?.filter((item) => item.voted)
      .map((item) => item.id!) || [],
); // 已投票选项编号
const voteStatus = computed<string>(() => {
  const now = Date.now();
  const startTime = new Date(detail.value?.voteStartTime || 0).getTime();
  const endTime = new Date(detail.value?.voteEndTime || 0).getTime();
  if (now < startTime) {
    return 'notStarted';
  }
  return now > endTime ? 'ended' : 'ongoing';
}); // 投票状态
const voteStatusText = computed(() =>
  voteStatus.value === 'notStarted'
    ? '未开始'
    : voteStatus.value === 'ended'
      ? '已结束'
      : '进行中',
); // 投票状态文本
const voteStatusTagType = computed(() =>
  voteStatus.value === 'ongoing'
    ? ('success' as const)
    : voteStatus.value === 'ended'
      ? ('info' as const)
      : ('warning' as const),
); // 投票状态标签类型
const voteDisabled = computed(() => {
  if (voteStatus.value !== 'ongoing') {
    return true;
  }
  return detail.value.voteMultiple
    ? votedOptionIds.value.length >= (detail.value.voteOptions?.length || 0)
    : hasVoted.value;
}); // 是否禁止投票
const voteCount = computed(() =>
  (detail.value?.voteOptions || []).reduce(
    (total, item) => total + (item.voteCount || 0),
    0,
  ),
); // 投票总票数

/** 获得投票选项百分比 */
function getVotePercentage(option: OaDiscussionVoteApi.VoteOption) {
  return voteCount.value > 0
    ? Math.round(((option.voteCount || 0) / voteCount.value) * 100)
    : 0;
}

/** 提交投票 */
async function submitVote() {
  if (!detail.value?.id || submitLoading.value) {
    return;
  }
  // 校验投票选项
  const optionIds = detail.value.voteMultiple
    ? selectedOptionIds.value.filter(
        (optionId) => !votedOptionIds.value.includes(optionId),
      )
    : selectedOptionId.value
      ? [selectedOptionId.value]
      : [];
  if (optionIds.length === 0) {
    ElMessage.warning('请选择投票选项');
    return;
  }
  // 提交投票
  submitLoading.value = true;
  try {
    await voteDiscussion(detail.value.id, optionIds);
    ElMessage.success('投票成功');
    // 刷新投票结果
    emit('success');
  } finally {
    submitLoading.value = false;
  }
}

/** 回显已提交的选项 */
watch(
  () => props.detail,
  (discussion) => {
    selectedOptionIds.value =
      discussion.voteOptions
        ?.filter((item) => item.voted)
        .map((item) => item.id!) || [];
    selectedOptionId.value = selectedOptionIds.value[0];
  },
  { immediate: true },
);
</script>

<template>
  <ElCard shadow="never" class="my-4">
    <template #header>
      <div class="flex items-center justify-between">
        <span>投票（{{ getDiscussionVoteModeName(detail.voteMultiple) }}）</span>
        <ElTag :type="voteStatusTagType">{{ voteStatusText }}</ElTag>
      </div>
    </template>
    <div class="text-muted-foreground mb-3 text-[13px]">
      {{ formatDate(detail.voteStartTime) }} 至 {{ formatDate(detail.voteEndTime) }}
    </div>
    <ElCheckboxGroup v-if="detail.voteMultiple" v-model="selectedOptionIds">
      <div v-for="option in detail.voteOptions" :key="option.id" class="mb-3.5">
        <ElCheckbox
          :value="option.id"
          :disabled="voteStatus !== 'ongoing' || !!option.voted"
        >
          {{ option.title }}（{{ option.voteCount || 0 }} 票）
        </ElCheckbox>
        <ElProgress
          :percentage="getVotePercentage(option)"
          :color="option.color || undefined"
          :stroke-width="8"
        />
        <ElPopover
          v-if="option.voterUserNames?.length"
          trigger="click"
          title="投票人"
          :width="240"
        >
          <template #reference>
            <ElButton link type="primary">查看投票人</ElButton>
          </template>
          <div class="break-words">{{ option.voterUserNames.join('、') }}</div>
        </ElPopover>
      </div>
    </ElCheckboxGroup>
    <ElRadioGroup v-else v-model="selectedOptionId" class="!block">
      <div v-for="option in detail.voteOptions" :key="option.id" class="mb-3.5">
        <ElRadio :value="option.id" :disabled="voteDisabled">
          {{ option.title }}（{{ option.voteCount || 0 }} 票）
        </ElRadio>
        <ElProgress
          :percentage="getVotePercentage(option)"
          :color="option.color || undefined"
          :stroke-width="8"
        />
        <ElPopover
          v-if="option.voterUserNames?.length"
          trigger="click"
          title="投票人"
          :width="240"
        >
          <template #reference>
            <ElButton link type="primary">查看投票人</ElButton>
          </template>
          <div class="break-words">{{ option.voterUserNames.join('、') }}</div>
        </ElPopover>
      </div>
    </ElRadioGroup>
    <ElButton
      v-if="!voteDisabled"
      type="primary"
      :loading="submitLoading"
      @click="submitVote"
    >
      提交投票
    </ElButton>
    <ElTag v-else-if="hasVoted" type="success">已投票</ElTag>
  </ElCard>
</template>
