<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { prompt } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { useDebounceFn } from '@vueuse/core';
import {
  Alert,
  Button,
  Drawer,
  Input,
  InputNumber,
  message,
  Spin,
  Table,
  Tag,
} from 'antdv-next';

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

defineOptions({ name: 'HrmPortalPerformanceReviewForm' });

const emit = defineEmits<{
  success: [];
}>();

const drawerVisible = ref(false);
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

watch(drawerVisible, (visible) => {
  document.body.classList.toggle('hrm-performance-review-open', visible);
});
onBeforeUnmount(() =>
  document.body.classList.remove('hrm-performance-review-open'),
);

/** 打开弹窗 */
async function open(assessmentId?: number, stageId?: number) {
  if (!assessmentId || !stageId) {
    return;
  }
  drawerVisible.value = true;
  loading.value = true;
  stageComment.value = '';
  scorePreview.value = undefined;
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
    schedulePreview();
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });

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
    drawerVisible.value = false;
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
    message.error('请完成全部指标评分');
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
    drawerVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Drawer
    v-model:open="drawerVisible"
    :destroy-on-close="true"
    :width="880"
    title="绩效评分"
  >
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

      <Table
        bordered
        :columns="[
          {
            title: '维度',
            dataIndex: 'dimensionName',
            key: 'dimensionName',
            width: 110,
          },
          { title: '指标', dataIndex: 'name', key: 'name', minWidth: 145 },
          {
            title: '目标值',
            dataIndex: 'targetValue',
            key: 'targetValue',
            minWidth: 125,
          },
          { title: '实际值', key: 'actualValue', minWidth: 125 },
          { title: '评分', key: 'finalScore', width: 110 },
          { title: '评语', key: 'comment', minWidth: 160 },
        ]"
        :data-source="detail.quotas || []"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actualValue'">
            <Input
              v-model:value="record.actualValue"
              :maxlength="1000"
              placeholder="实际完成情况"
            />
          </template>
          <template v-else-if="column.key === 'finalScore'">
            <InputNumber
              v-model:value="record.finalScore"
              class="w-full"
              :controls="false"
              :max="detail.upperLimitScore"
              :min="0"
              :precision="2"
              @change="schedulePreview"
            />
          </template>
          <template v-else-if="column.key === 'comment'">
            <Input
              v-model:value="record.comment"
              :maxlength="1000"
              placeholder="指标评语"
            />
          </template>
        </template>
      </Table>

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
        <Button @click="drawerVisible = false">取消</Button>
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
