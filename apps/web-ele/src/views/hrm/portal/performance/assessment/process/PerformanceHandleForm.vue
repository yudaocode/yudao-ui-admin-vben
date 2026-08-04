<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  getPerformanceAssessment,
  handlePerformanceAssessmentAppeal,
  handlePerformanceAssessmentResultAudit,
} from '#/api/hrm/portal/performance/assessment';
import {
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceConfirmationResult,
} from '#/views/hrm/utils/constants';
import { formatHrmDateTime, formatHrmScore } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmPortalPerformanceHandleForm' });

const props = defineProps<{
  mode: 'appeal' | 'result-audit';
}>();

const emit = defineEmits<{
  success: [];
}>();

const dialogVisible = ref(false);
const loading = ref(false);
const submitting = ref(false);
const detail =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>({});
const reviewStageIds = ref<number[]>([]);
const comment = ref('');

const title = computed(() =>
  props.mode === 'appeal' ? '绩效申诉确认' : '绩效结果审核',
);
const completedReviewStages = computed(() =>
  (detail.value.reviewStages || []).filter(
    (stage) =>
      stage.id !== null &&
      stage.status === HrmPerformanceAssessmentStageStatus.PROCESSED,
  ),
);
const appealReviewStageNames = computed(() => {
  const selectedIds = new Set(detail.value.appealReviewStageIds || []);
  return completedReviewStages.value
    .filter(
      (stage) =>
        stage.id !== undefined &&
        stage.id !== null &&
        selectedIds.has(stage.id as number),
    )
    .map((stage) => stage.name || '评分阶段')
    .join('、');
});

/** 打开弹窗 */
async function open(assessmentId?: number, stageId?: number) {
  if (!assessmentId || !stageId) {
    return;
  }
  dialogVisible.value = true;
  loading.value = true;
  detail.value = {};
  reviewStageIds.value = [];
  comment.value = '';
  try {
    detail.value = await getPerformanceAssessment(assessmentId, stageId);
    const latestStage =
      completedReviewStages.value[completedReviewStages.value.length - 1];
    reviewStageIds.value = latestStage?.id ? [latestStage.id] : [];
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });

/** 处理当前绩效阶段 */
async function submitForm(pass: boolean) {
  if (!detail.value.id || !detail.value.currentStage?.id) {
    return;
  }
  if (
    !pass &&
    props.mode === 'result-audit' &&
    reviewStageIds.value.length === 0
  ) {
    ElMessage.warning('请选择需要退回的评分节点');
    return;
  }
  try {
    await confirm(`确认${pass ? '通过' : '驳回'}当前${title.value}？`);
  } catch {
    return;
  }
  submitting.value = true;
  try {
    const data: HrmPortalPerformanceAssessmentApi.HandleStageReq = {
      assessmentId: detail.value.id,
      stageId: detail.value.currentStage.id,
      pass: pass
        ? HrmPerformanceConfirmationResult.PASS
        : HrmPerformanceConfirmationResult.REJECT,
      comment: comment.value.trim() || undefined,
      reviewStageIds:
        !pass && props.mode === 'result-audit'
          ? reviewStageIds.value
          : undefined,
    };
    await (props.mode === 'appeal'
      ? handlePerformanceAssessmentAppeal(data)
      : handlePerformanceAssessmentResultAudit(data));
    ElMessage.success(`${title.value}处理成功`);
    dialogVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog v-model="dialogVisible" :title="title" width="900px">
    <div v-loading="loading">
      <ElDescriptions border class="mb-4" :column="3" size="small">
        <ElDescriptionsItem label="考核名称">
          {{ detail.name || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="被考核人">
          {{ detail.employeeName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="工号">
          {{ detail.jobNumber || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="当前节点">
          {{ detail.currentStage?.name || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="绩效得分">
          {{ formatHrmScore(detail.score) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="绩效等级">
          {{ detail.resultLevel || '-' }}
        </ElDescriptionsItem>
        <template v-if="mode === 'appeal'">
          <ElDescriptionsItem label="申诉原因" :span="3">
            {{ detail.appealReason || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉时间">
            {{ formatHrmDateTime(detail.appealSubmitTime?.valueOf()) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="申诉附件" :span="2">
            <div
              v-if="detail.appealFileUrls?.length"
              class="flex flex-wrap gap-2"
            >
              <ElButton
                v-for="url in detail.appealFileUrls"
                :key="url"
                link
                type="primary"
                @click="openWindow(url)"
              >
                {{ getFileNameFromUrl(url) }}
              </ElButton>
            </div>
            <span v-else>-</span>
          </ElDescriptionsItem>
        </template>
      </ElDescriptions>

      <ElTable
        border
        class="mb-4"
        :data="detail.quotas || []"
        max-height="300"
        row-key="id"
        size="small"
      >
        <ElTableColumn label="维度" min-width="120" prop="dimensionName" />
        <ElTableColumn label="指标" min-width="150" prop="name" />
        <ElTableColumn label="目标值" min-width="120" prop="targetValue" />
        <ElTableColumn label="实际值" min-width="120" prop="actualValue" />
        <ElTableColumn align="center" label="最终分" width="90">
          <template #default="{ row }">
            {{ formatHrmScore(row.finalScore) }}
          </template>
        </ElTableColumn>
      </ElTable>

      <ElForm label-width="110px">
        <ElFormItem v-if="mode === 'result-audit'" label="退回评分节点">
          <ElCheckboxGroup v-model="reviewStageIds">
            <ElCheckbox
              v-for="stage in completedReviewStages"
              :key="stage.id"
              :label="stage.id"
              :value="stage.id"
            >
              {{ stage.name || '评分阶段' }}
              <span v-if="stage.handlerName">（{{ stage.handlerName }}）</span>
            </ElCheckbox>
          </ElCheckboxGroup>
        </ElFormItem>
        <ElFormItem v-else label="申诉评分节点">
          <span>{{ appealReviewStageNames || '-' }}</span>
        </ElFormItem>
        <ElFormItem label="处理意见">
          <ElInput
            v-model="comment"
            maxlength="500"
            placeholder="请输入处理意见"
            :rows="3"
            show-word-limit
            type="textarea"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <ElButton :disabled="loading" @click="dialogVisible = false">
        取消
      </ElButton>
      <ElButton :loading="submitting" type="danger" @click="submitForm(false)">
        驳回
      </ElButton>
      <ElButton :loading="submitting" type="primary" @click="submitForm(true)">
        通过
      </ElButton>
    </template>
  </ElDialog>
</template>
