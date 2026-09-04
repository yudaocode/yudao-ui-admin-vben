<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPortalPerformanceAssessmentApi } from '#/api/hrm/portal/performance/assessment';

import { computed, nextTick, watch } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import { Button, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { DictTag } from '#/components/dict-tag';
import {
  HrmPerformanceAppealStatus,
  HrmPerformanceAssessmentStageStatus,
  HrmPerformanceStageType,
} from '#/views/hrm/utils/constants';
import { formatHrmDate, formatHrmScore } from '#/views/hrm/utils/format';

import { useTaskGridColumns } from '../data';

defineOptions({ name: 'HrmPortalPerformanceTaskTable' });

const props = defineProps<{
  activeStatus: number;
  activeTab: number;
  list: HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment[];
  loading: boolean;
}>();

const emit = defineEmits<{
  appeal: [id?: number];
  appealHandle: [assessmentId?: number, stageId?: number];
  detail: [row: HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment];
  quota: [id?: number];
  resultAudit: [assessmentId?: number, stageId?: number];
  resultConfirm: [id?: number];
  review: [assessmentId?: number, stageId?: number];
  targetConfirm: [assessmentId?: number, stageId?: number];
}>();

const { hasAccessByCodes } = useAccess();
const selfTask = computed(
  () =>
    props.activeTab === HrmPerformanceStageType.FILL_QUOTA ||
    props.activeTab === HrmPerformanceStageType.RESULT_CONFIRM,
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useTaskGridColumns(selfTask.value),
    data: [],
    minHeight: 280,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmPortalPerformanceAssessmentApi.PortalPerformanceAssessment>,
});

watch(
  [() => props.list, selfTask, () => props.loading],
  async ([list]) => {
    await nextTick();
    gridApi.setGridOptions({
      columns: useTaskGridColumns(selfTask.value),
      loading: props.loading,
    });
    await gridApi.grid.reloadData(list);
  },
  { immediate: true },
);
</script>

<template>
  <Grid class="w-full">
    <template #cycle="{ row }">
      {{ formatHrmDate(row.startTime) }} 至 {{ formatHrmDate(row.endTime) }}
    </template>
    <template #employee="{ row }">
      {{ row.employeeName || '-' }}
      <span class="text-muted-foreground ml-1 text-xs">{{
        row.jobNumber || ''
      }}</span>
    </template>
    <template #currentStage="{ row }">
      <template v-if="selfTask">{{ row.currentStage?.name || '-' }}</template>
      <span v-else-if="activeTab === HrmPerformanceStageType.OTHER_SCORE">
        {{ row.currentReviewStage?.name || '待评分' }}
      </span>
      <span
        v-else-if="
          activeTab === HrmPerformanceStageType.RESULT_AUDIT ||
          activeTab === HrmPerformanceStageType.APPEAL_CONFIRM
        "
      >
        {{ row.currentStage?.name || '待处理' }}
      </span>
      <DictTag
        v-else
        :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
        :value="row.stageType ?? 0"
      />
    </template>
    <template #score="{ row }">{{ formatHrmScore(row.score) }}</template>
    <template #resultLevel="{ row }">
      <Tag v-if="row.resultLevel" color="success">{{ row.resultLevel }}</Tag>
      <span v-else>-</span>
    </template>
    <template #metric="{ row }">
      <span v-if="activeTab === HrmPerformanceStageType.TARGET_CONFIRM">
        {{ row.quotas?.length || 0 }}
      </span>
      <span v-else-if="activeTab === HrmPerformanceStageType.OTHER_SCORE">
        {{ row.currentReviewStage?.weight || 0 }}%
      </span>
      <span v-else>{{ formatHrmScore(row.score) }}</span>
    </template>
    <template #actions="{ row }">
      <template v-if="selfTask">
        <Button type="link" @click="emit('detail', row)">详情</Button>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.FILL_QUOTA &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            row.stageType === HrmPerformanceStageType.FILL_QUOTA &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('quota', row.id)"
        >
          制定指标
        </Button>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.RESULT_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('resultConfirm', row.id)"
        >
          确认结果
        </Button>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.RESULT_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            row.appealStatus !== HrmPerformanceAppealStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('appeal', row.id)"
        >
          提交申诉
        </Button>
      </template>
      <template v-else>
        <Button
          v-if="
            activeTab === HrmPerformanceStageType.TARGET_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('targetConfirm', row.id, row.currentStage?.id)"
        >
          去确认
        </Button>
        <Button
          v-else-if="
            activeTab === HrmPerformanceStageType.OTHER_SCORE &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('review', row.id, row.currentReviewStage?.id)"
        >
          去评分
        </Button>
        <Button
          v-else-if="
            activeTab === HrmPerformanceStageType.RESULT_AUDIT &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('resultAudit', row.id, row.currentStage?.id)"
        >
          去审核
        </Button>
        <Button
          v-else-if="
            activeTab === HrmPerformanceStageType.APPEAL_CONFIRM &&
            activeStatus === HrmPerformanceAssessmentStageStatus.PENDING &&
            hasAccessByCodes(['hrm:portal:performance:action'])
          "
          type="link"
          @click="emit('appealHandle', row.id, row.currentStage?.id)"
        >
          去确认
        </Button>
        <Button v-else type="link" @click="emit('detail', row)">查看</Button>
      </template>
    </template>
  </Grid>
</template>
