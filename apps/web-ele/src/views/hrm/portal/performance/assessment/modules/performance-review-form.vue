<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

import { prompt, useVbenDrawer } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { useDebounceFn } from '@vueuse/core';
import {
  ElAlert,
  ElButton,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElTag,
} from 'element-plus';

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

import { useReviewEditGridColumns } from '../data';

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
const canReject = computed(
  () =>
    currentStage.value?.rejectAuthority === true &&
    !!detail.value.reviewStages?.some(
      (stage) =>
        stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED &&
        (stage.sort || 0) < (currentStage.value?.sort || 0),
    ),
);

onBeforeUnmount(() =>
  document.body.classList.remove('hrm-performance-review-open'),
);

/** 预览绩效分数 */
async function previewScore() {
  const stage = currentStage.value;
  const quotaList = detail.value.quotas || [];
  if (
    !detail.value.id ||
    !stage?.id ||
    quotaList.length === 0 ||
    quotaList.some(
      (quota) => quota.finalScore === undefined || quota.finalScore === null,
    )
  ) {
    scorePreview.value = undefined;
    return;
  }
  try {
    scorePreview.value = await previewPerformanceAssessmentScore({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      quotas: quotaList,
    });
  } catch {
    scorePreview.value = undefined;
  }
}
const schedulePreview = useDebounceFn(previewScore, 250);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useReviewEditGridColumns(),
    data: [],
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
    if (!isOpen) return;
    const { assessmentId, stageId } = drawerApi.getData() as {
      assessmentId?: number;
      stageId?: number;
    };
    if (!assessmentId || !stageId) {
      await drawerApi.close();
      return;
    }
    stageComment.value = '';
    scorePreview.value = undefined;
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
      ElMessage.warning('驳回原因不能为空');
      return;
    }
    submitting.value = true;
    await rejectPerformanceAssessmentReviewStage({
      assessmentId: detail.value.id,
      reviewStageId: stage.id,
      reason,
    });
    ElMessage.success('上一评分阶段已驳回');
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
    quotaList.some(
      (quota) => quota.finalScore === undefined || quota.finalScore === null,
    )
  ) {
    ElMessage.error('请完成全部指标评分');
    return;
  }
  if (stage.requiredSetting && !stageComment.value.trim()) {
    ElMessage.error('请填写本阶段评语');
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
    ElMessage.success('当前阶段评分已提交');
    await drawerApi.close();
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer class="w-[880px]" title="绩效评分">
    <div v-loading="loading">
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
          <ElTag type="warning">{{ currentStage?.name || '待评分' }}</ElTag>
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
          <ElTag
            v-else-if="
              stage.status === HrmPerformanceAssessmentStageStatus.PENDING
            "
            type="warning"
          >
            待评分
          </ElTag>
          <ElTag v-else>未开始</ElTag>
          <span class="text-right">{{ stage.score ?? '-' }}</span>
        </div>
      </div>

      <ElAlert
        v-if="currentStage?.rejectReason"
        class="mb-4"
        show-icon
        :title="`评分被驳回：${currentStage.rejectReason}`"
        type="warning"
      />

      <div
        v-if="scorePreview"
        class="mb-4 flex min-h-[48px] items-center justify-between gap-5 border-y py-2"
      >
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">本阶段试算</span>
          <strong>{{ scorePreview.stageScore ?? '-' }} 分</strong>
          <ElTag v-if="scorePreview.stageResultLevel">
            {{ scorePreview.stageResultLevel }}
          </ElTag>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">当前累计分</span>
          <strong>{{ scorePreview.cumulativeScore ?? '-' }} 分</strong>
          <ElTag v-if="scorePreview.cumulativeResultLevel" type="success">
            {{ scorePreview.cumulativeResultLevel }}
          </ElTag>
        </div>
      </div>

      <ElAlert
        class="mb-3"
        show-icon
        :title="`单项评分范围为 0～${detail.upperLimitScore ?? '-'} 分，最多保留两位小数；总分按评分、维度权重和指标权重计算。`"
        type="info"
      />

      <Grid class="w-full">
        <template #actualValue="{ row }">
          <ElInput
            v-model="row.actualValue"
            maxlength="1000"
            placeholder="实际完成情况"
          />
        </template>
        <template #finalScore="{ row }">
          <ElInputNumber
            v-model="row.finalScore"
            class="!w-full"
            :controls="false"
            :max="detail.upperLimitScore"
            :min="0"
            :precision="2"
            @change="schedulePreview"
          />
        </template>
        <template #comment="{ row }">
          <ElInput
            v-model="row.comment"
            maxlength="1000"
            placeholder="指标评语"
          />
        </template>
      </Grid>

      <ElInput
        v-model="stageComment"
        class="mt-4"
        maxlength="2000"
        :placeholder="currentStage?.raterType === 4 ? '自评说明' : '评分说明'"
        :rows="3"
        show-word-limit
        type="textarea"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <ElButton
          v-if="canReject"
          :loading="submitting"
          type="danger"
          @click="rejectPreviousStage"
        >
          驳回上一阶段
        </ElButton>
        <ElButton @click="drawerApi.close()">取消</ElButton>
        <ElButton :loading="submitting" type="primary" @click="submitReview">
          提交评分
        </ElButton>
      </div>
    </template>
  </Drawer>
</template>
