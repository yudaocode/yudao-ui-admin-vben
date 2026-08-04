<script lang="ts" setup>
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Spin,
  Table,
} from 'antdv-next';

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
    message.warning('请选择需要退回的评分节点');
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
    message.success(`${title.value}处理成功`);
    dialogVisible.value = false;
    emit('success');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <Modal v-model:open="dialogVisible" :title="title" :width="900">
    <Spin :spinning="loading">
      <Descriptions bordered class="mb-4" :column="3" size="small">
        <DescriptionsItem label="考核名称">
          {{ detail.name || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="被考核人">
          {{ detail.employeeName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="工号">
          {{ detail.jobNumber || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="当前节点">
          {{ detail.currentStage?.name || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="绩效得分">
          {{ formatHrmScore(detail.score) }}
        </DescriptionsItem>
        <DescriptionsItem label="绩效等级">
          {{ detail.resultLevel || '-' }}
        </DescriptionsItem>
        <template v-if="mode === 'appeal'">
          <DescriptionsItem label="申诉原因" :span="3">
            {{ detail.appealReason || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="申诉时间">
            {{ formatHrmDateTime(detail.appealSubmitTime) }}
          </DescriptionsItem>
          <DescriptionsItem label="申诉附件" :span="2">
            <div
              v-if="detail.appealFileUrls?.length"
              class="flex flex-wrap gap-2"
            >
              <Button
                v-for="url in detail.appealFileUrls"
                :key="url"
                type="link"
                @click="openWindow(url)"
              >
                {{ getFileNameFromUrl(url) }}
              </Button>
            </div>
            <span v-else>-</span>
          </DescriptionsItem>
        </template>
      </Descriptions>

      <Table
        bordered
        class="mb-4"
        :columns="[
          {
            title: '维度',
            dataIndex: 'dimensionName',
            key: 'dimensionName',
            minWidth: 120,
          },
          { title: '指标', dataIndex: 'name', key: 'name', minWidth: 150 },
          {
            title: '目标值',
            dataIndex: 'targetValue',
            key: 'targetValue',
            minWidth: 120,
          },
          {
            title: '实际值',
            dataIndex: 'actualValue',
            key: 'actualValue',
            minWidth: 120,
          },
          { title: '最终分', key: 'finalScore', width: 90, align: 'center' },
        ]"
        :data-source="detail.quotas || []"
        :pagination="false"
        :scroll="{ y: 300 }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'finalScore'">
            {{ formatHrmScore(record.finalScore) }}
          </template>
        </template>
      </Table>

      <Form :label-col="{ style: { width: '110px' } }">
        <FormItem v-if="mode === 'result-audit'" label="退回评分节点">
          <CheckboxGroup v-model:value="reviewStageIds">
            <Checkbox
              v-for="stage in completedReviewStages"
              :key="stage.id"
              :value="stage.id"
            >
              {{ stage.name || '评分阶段' }}
              <span v-if="stage.handlerName">（{{ stage.handlerName }}）</span>
            </Checkbox>
          </CheckboxGroup>
        </FormItem>
        <FormItem v-else label="申诉评分节点">
          <span>{{ appealReviewStageNames || '-' }}</span>
        </FormItem>
        <FormItem label="处理意见">
          <Input.TextArea
            v-model:value="comment"
            :maxlength="500"
            placeholder="请输入处理意见"
            :rows="3"
            show-count
          />
        </FormItem>
      </Form>
    </Spin>

    <template #footer>
      <Button :disabled="loading" @click="dialogVisible = false">取消</Button>
      <Button danger :loading="submitting" @click="submitForm(false)">
        驳回
      </Button>
      <Button :loading="submitting" type="primary" @click="submitForm(true)">
        通过
      </Button>
    </template>
  </Modal>
</template>
