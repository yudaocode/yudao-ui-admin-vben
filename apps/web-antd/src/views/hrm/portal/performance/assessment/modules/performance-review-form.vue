<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

import { prompt, useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { useDebounceFn } from '@vueuse/core';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  message,
  Spin,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getPerformanceAssessment,
  previewPerformanceAssessmentScore,
  rejectPerformanceAssessmentReviewStage,
  scorePerformanceAssessment,
} from '#/api/hrm/portal/performance/assessment';
import { DictTag } from '#/components/dict-tag';
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceRaterType,
} from '#/views/hrm/utils/constants';
import {
  isCompletionRateQuota,
  isValidActualValue,
} from '#/views/hrm/utils/performance';

import { useReviewEditGridColumns } from '../data';

type PortalQuota = NonNullable<
  HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment['quotas']
>[number];

defineOptions({ name: 'HrmPortalPerformanceReviewForm' });

const emit = defineEmits<{
  success: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const detail =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>({});
const stageComment = ref('');
const scorePreview = ref<HrmPortalPerformanceAssessmentApi.ScorePreview>();

const currentStage = computed(() => detail.value.currentReviewStage);
const actualValueEditable = computed(
  () => currentStage.value?.actualValueEditable === true,
); // 当前阶段是否录入完成率实际值
const hasCompletionRateQuota = computed(() =>
  (detail.value.quotas || []).some((quota) =>
    isCompletionRateQuota(quota.scoreType),
  ),
); // 是否包含完成率指标
const quotaPreviewScoreMap = computed(
  () =>
    new Map(
      (scorePreview.value?.quotaScores || []).map((score) => [
        score.assessmentQuotaId,
        score.score,
      ]),
    ),
); // 后端试算的指标得分
const canReject = computed(
  () =>
    currentStage.value?.rejectAuthority === true &&
    !!detail.value.reviewStages?.some(
      (stage) =>
        stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED &&
        // 与后端一致按 sort、编号排序：sort 相同时编号更小的阶段在前
        ((stage.sort || 0) < (currentStage.value?.sort || 0) ||
          ((stage.sort || 0) === (currentStage.value?.sort || 0) &&
            (stage.id || 0) < (currentStage.value?.id || 0))),
    ),
);

let cancelPreview: (() => void) | undefined; // 取消进行中的试算回调

/** 作废当前试算：取消进行中的试算回调，并清空已展示的结果 */
function invalidatePreview() {
  cancelPreview?.();
  cancelPreview = undefined;
  scorePreview.value = undefined;
}

onBeforeUnmount(() => {
  document.body.classList.remove('hrm-performance-review-open');
  invalidatePreview();
});

/** 判断指标是否已填写完整：手工指标需评分，录入阶段的完成率指标需合法实际值 */
function isQuotaFilled(quota: PortalQuota) {
  if (isCompletionRateQuota(quota.scoreType)) {
    return !actualValueEditable.value || isValidActualValue(quota.actualValue);
  }
  return quota.finalScore !== undefined && quota.finalScore !== null;
}

/** 构建试算输入快照：手工指标取评分，完成率指标取实际值 */
function buildPreviewKey() {
  return JSON.stringify([
    detail.value.id,
    currentStage.value?.id,
    (detail.value.quotas || []).map((quota) => [
      quota.id,
      isCompletionRateQuota(quota.scoreType)
        ? quota.actualValue
        : quota.finalScore,
    ]),
  ]);
}

/** 预览绩效分数 */
async function previewScore() {
  invalidatePreview();
  // 抽屉已关闭或正在提交时，不再发起排队中的试算
  if (!drawerApi.store.state.isOpen || submitting.value) {
    return;
  }
  const stage = currentStage.value;
  const quotaList = detail.value.quotas || [];
  if (
    !detail.value.id ||
    !stage?.id ||
    quotaList.length === 0 ||
    !quotaList.every((quota) => isQuotaFilled(quota))
  ) {
    return;
  }
  // 本次试算被新的输入、关闭或重新打开取代后，丢弃其结果
  let cancelled = false;
  cancelPreview = () => {
    cancelled = true;
  };
  const previewKey = buildPreviewKey();
  try {
    const result = await previewPerformanceAssessmentScore({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      quotas: quotaList,
    });
    if (!cancelled && previewKey === buildPreviewKey()) {
      scorePreview.value = result;
    }
  } catch {
    if (!cancelled && previewKey === buildPreviewKey()) {
      scorePreview.value = undefined;
    }
  }
}
const debouncePreview = useDebounceFn(previewScore, 250);

/** 评分输入变化：立即作废当前试算，再防抖重新试算 */
function schedulePreview() {
  invalidatePreview();
  debouncePreview();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useReviewEditGridColumns(),
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<
    NonNullable<
      HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment['quotas']
    >[number]
  >,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    document.body.classList.toggle('hrm-performance-review-open', isOpen);
    if (!isOpen) {
      invalidatePreview();
      return;
    }
    const { assessmentId, stageId } = drawerApi.getData() as {
      assessmentId?: number;
      stageId?: number;
    };
    if (!assessmentId || !stageId) {
      await drawerApi.close();
      return;
    }
    stageComment.value = '';
    invalidatePreview();
    detail.value = {}; // 清空上次打开的数据，使其未返回的试算结果失效
    drawerApi.lock();
    try {
      detail.value = await getPerformanceAssessment(assessmentId, stageId);
      stageComment.value = detail.value.currentReviewStage?.comment || '';
      const scoreMap = new Map(
        (detail.value.currentReviewStage?.quotaScoreList || []).map((score) => [
          score.assessmentQuotaId,
          score.score,
        ]),
      );
      detail.value.quotas?.forEach((quota) => {
        quota.finalScore = scoreMap.get(quota.id);
      });
      await nextTick();
      await gridApi.grid.reloadData(detail.value.quotas || []);
      schedulePreview();
    } finally {
      drawerApi.unlock();
    }
  },
});

/** 驳回至上一评分阶段 */
async function rejectPreviousStage() {
  const stage = currentStage.value;
  if (!detail.value.id || !stage?.id) {
    return;
  }
  try {
    const result = await prompt({
      content: '请输入驳回原因',
      title: '驳回上一评分阶段',
    });
    const reason = result?.trim();
    if (!reason) {
      message.warning('驳回原因不能为空');
      return;
    }
    submitting.value = true;
    await rejectPerformanceAssessmentReviewStage({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      reason,
    });
    message.success('上一评分阶段已驳回');
    await drawerApi.close();
    emit('success');
  } catch {
    // 用户取消
  } finally {
    submitting.value = false;
  }
}

/** 提交绩效评分 */
async function submitReview() {
  const stage = currentStage.value;
  if (!detail.value.id || !stage?.id) {
    return;
  }
  const quotaList = detail.value.quotas || [];
  if (
    quotaList.length === 0 ||
    !quotaList.every((quota) => isQuotaFilled(quota))
  ) {
    message.error(
      hasCompletionRateQuota.value && actualValueEditable.value
        ? '请完成全部指标评分，并填写完成率指标的实际值（不小于 0 的数字）'
        : '请完成全部指标评分',
    );
    return;
  }
  if (stage.requiredSetting && !stageComment.value.trim()) {
    message.error('请填写本阶段评语');
    return;
  }
  submitting.value = true;
  try {
    await scorePerformanceAssessment({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      comment: stageComment.value.trim(),
      selfComment:
        stage.raterType === HrmPerformanceRaterType.SELF
          ? stageComment.value.trim()
          : undefined,
      reviewerComment:
        stage.raterType === HrmPerformanceRaterType.SELF
          ? undefined
          : stageComment.value.trim(),
      quotas: quotaList,
    });
    message.success('当前阶段评分已提交');
    await drawerApi.close();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer class="w-[880px]" title="绩效评分">
    <Spin :spinning="loading">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <div class="text-xl font-semibold">
            {{ detail.employeeName || '-' }}
          </div>
          <div class="text-muted-foreground mt-1 text-sm">
            {{ detail.name || '-' }}
          </div>
        </div>
        <div class="flex items-center gap-2 whitespace-nowrap">
          <Tag color="warning">{{ currentStage?.name || '待评分' }}</Tag>
          <span>权重 {{ currentStage?.weight || 0 }}%</span>
        </div>
      </div>

      <div v-if="detail.reviewStages?.length" class="mb-4 border-t">
        <div
          v-for="stage in detail.reviewStages"
          :key="stage.id"
          class="grid min-h-[52px] grid-cols-[minmax(180px,1fr)_70px_80px_70px] items-center border-b"
        >
          <div>
            <div>{{ stage.name }}</div>
            <div class="text-muted-foreground mt-1 text-sm">
              {{ stage.handlerName || '-' }}
            </div>
          </div>
          <span>{{ stage.weight || 0 }}%</span>
          <DictTag
            v-if="
              stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED
            "
            :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
            :value="stage.status"
          />
          <Tag
            v-else-if="
              stage.status === HrmPerformanceAssessmentStageStatus.PENDING
            "
            color="warning"
          >
            待评分
          </Tag>
          <Tag v-else>未开始</Tag>
          <span class="text-right">{{ stage.score ?? '-' }}</span>
        </div>
      </div>

      <Alert
        v-if="currentStage?.rejectReason"
        class="mb-4"
        :message="`评分被驳回：${currentStage.rejectReason}`"
        show-icon
        type="warning"
      />

      <div
        v-if="scorePreview"
        class="mb-4 flex min-h-[48px] items-center justify-between gap-5 border-y py-2"
      >
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">本阶段试算</span>
          <strong>{{ scorePreview.stageScore ?? '-' }} 分</strong>
          <Tag v-if="scorePreview.stageResultLevel">
            {{ scorePreview.stageResultLevel }}
          </Tag>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">当前累计分</span>
          <strong>{{ scorePreview.cumulativeScore ?? '-' }} 分</strong>
          <Tag v-if="scorePreview.cumulativeResultLevel" color="success">
            {{ scorePreview.cumulativeResultLevel }}
          </Tag>
        </div>
      </div>

      <Alert
        class="mb-3"
        :message="`单项评分范围为 0～${detail.upperLimitScore ?? '-'} 分，最多保留两位小数；总分按评分、维度权重和指标权重计算。`"
        show-icon
        type="info"
      />
      <Alert
        v-if="hasCompletionRateQuota"
        class="mb-3"
        :message="
          actualValueEditable
            ? '完成率指标请在本阶段录入实际值（纯数字），提交后后续阶段只读；得分 = min(实际值 ÷ 目标值, 1) × 评分上限，由系统计算。'
            : '完成率指标的实际值由首个评分阶段录入，当前只读；得分由系统按目标值和实际值计算。'
        "
        show-icon
        :type="actualValueEditable ? 'warning' : 'info'"
      />

      <Grid class="w-full">
        <template #actualValue="{ row }">
          <span
            v-if="isCompletionRateQuota(row.scoreType) && !actualValueEditable"
          >
            {{ row.actualValue || '-' }}
          </span>
          <Input
            v-else-if="isCompletionRateQuota(row.scoreType)"
            v-model:value="row.actualValue"
            :maxlength="1000"
            placeholder="不小于 0 的数字"
            @change="schedulePreview"
          />
          <Input
            v-else
            v-model:value="row.actualValue"
            :maxlength="1000"
            placeholder="实际完成情况"
          />
        </template>
        <template #finalScore="{ row }">
          <div
            v-if="isCompletionRateQuota(row.scoreType)"
            class="flex flex-col"
          >
            <span>{{ quotaPreviewScoreMap.get(row.id) ?? '-' }}</span>
            <span class="text-muted-foreground text-xs">完成率计算</span>
          </div>
          <InputNumber
            v-else
            v-model:value="row.finalScore"
            class="w-full"
            :controls="false"
            :max="detail.upperLimitScore"
            :min="0"
            :precision="2"
            @change="schedulePreview"
          />
        </template>
        <template #comment="{ row }">
          <Input
            v-model:value="row.comment"
            :maxlength="1000"
            placeholder="指标评语"
          />
        </template>
      </Grid>

      <Input.TextArea
        v-model:value="stageComment"
        class="mt-4"
        :maxlength="2000"
        :placeholder="currentStage?.raterType === 4 ? '自评说明' : '评分说明'"
        :rows="3"
        show-count
      />
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          v-if="canReject"
          danger
          :loading="submitting"
          @click="rejectPreviousStage"
        >
          驳回上一阶段
        </Button>
        <Button @click="drawerApi.close()">取消</Button>
        <Button :loading="submitting" type="primary" @click="submitReview">
          提交评分
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
:global(body.hrm-performance-review-open .ant-back-top) {
  display: none;
}
</style>
