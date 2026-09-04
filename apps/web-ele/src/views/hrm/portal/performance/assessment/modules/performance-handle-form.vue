<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, nextTick, ref } from 'vue';

import { confirm, useVbenForm, useVbenModal } from '@vben/common-ui';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import { ElMessage as message } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
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

import { useHandleFormSchema, useHandleQuotaGridColumns } from '../data';

defineOptions({ name: 'HrmPortalPerformanceHandleForm' });

const props = defineProps<{ mode: 'appeal' | 'result-audit' }>();
const emit = defineEmits<{ success: [] }>();
const detail =
  ref<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>({});

type PerformanceQuota = NonNullable<
  HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment['quotas']
>[number];

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
        stage.id !== null &&
        stage.id !== undefined &&
        selectedIds.has(stage.id),
    )
    .map((stage) => stage.name || '评分阶段')
    .join('、');
});

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 110 },
  layout: 'horizontal',
  schema: useHandleFormSchema(props.mode),
  showDefaultActions: false,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useHandleQuotaGridColumns(),
    data: [],
    maxHeight: 300,
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<PerformanceQuota>,
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { assessmentId, stageId } = modalApi.getData() as {
      assessmentId?: number;
      stageId?: number;
    };
    if (!assessmentId || !stageId) {
      await modalApi.close();
      return;
    }
    modalApi.lock();
    try {
      detail.value = await getPerformanceAssessment(assessmentId, stageId);
      const latestStage = completedReviewStages.value.at(-1);
      formApi.updateSchema([
        {
          fieldName: 'reviewStageIds',
          componentProps: {
            options: completedReviewStages.value.map((stage) => ({
              label: stage.handlerName
                ? `${stage.name || '评分阶段'}（${stage.handlerName}）`
                : stage.name || '评分阶段',
              value: stage.id,
            })),
          },
        },
      ]);
      await formApi.setValues({
        comment: '',
        reviewStageIds: latestStage?.id ? [latestStage.id] : [],
      });
      await nextTick();
      await gridApi.grid.reloadData(detail.value.quotas || []);
    } finally {
      modalApi.unlock();
    }
  },
});

/** 处理当前绩效阶段 */
async function submitForm(pass: boolean) {
  if (!detail.value.id || !detail.value.currentStage?.id) return;
  const values = await formApi.getValues();
  const reviewStageIds = (values.reviewStageIds || []) as number[];
  if (!pass && props.mode === 'result-audit' && reviewStageIds.length === 0) {
    message.warning('请选择需要退回的评分节点');
    return;
  }
  try {
    await confirm(`确认${pass ? '通过' : '驳回'}当前${title.value}？`);
  } catch {
    return;
  }
  modalApi.lock();
  try {
    const data: HrmPortalPerformanceAssessmentApi.HandleStageReq = {
      assessmentId: detail.value.id,
      stageId: detail.value.currentStage.id,
      pass: pass
        ? HrmPerformanceConfirmationResult.PASS
        : HrmPerformanceConfirmationResult.REJECT,
      comment: (values.comment as string | undefined)?.trim() || undefined,
      reviewStageIds:
        !pass && props.mode === 'result-audit' ? reviewStageIds : undefined,
    };
    await (props.mode === 'appeal'
      ? handlePerformanceAssessmentAppeal(data)
      : handlePerformanceAssessmentResultAudit(data));
    message.success(`${title.value}处理成功`);
    await modalApi.close();
    emit('success');
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <Modal :title="title" class="w-[900px]">
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
          {{ formatHrmDateTime(detail.appealSubmitTime) }}
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
              @click="openWindow(url)"
            >
              {{ getFileNameFromUrl(url) }}
            </ElButton>
          </div>
          <span v-else>-</span>
        </ElDescriptionsItem>
      </template>
    </ElDescriptions>
    <Grid class="mb-4 w-full">
      <template #finalScore="{ row }">
        {{ formatHrmScore(row.finalScore) }}
      </template>
    </Grid>
    <div v-if="mode === 'appeal'" class="mb-4 flex gap-4 px-4 text-sm">
      <span class="w-[110px] shrink-0 text-right">申诉评分节点</span>
      <span>{{ appealReviewStageNames || '-' }}</span>
    </div>
    <Form class="mx-4" />
    <template #footer>
      <ElButton @click="modalApi.close()">取消</ElButton>
      <ElButton type="danger" @click="submitForm(false)">驳回</ElButton>
      <ElButton type="primary" @click="submitForm(true)">通过</ElButton>
    </template>
  </Modal>
</template>
