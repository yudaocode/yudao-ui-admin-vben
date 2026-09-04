<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { nextTick, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { formatHrmDate } from '#/views/hrm/utils/format';
import {
  formatHrmPerformanceAppealTimeout,
  formatHrmPerformancePlanCycle,
  formatHrmPerformanceQuotaSettingType,
  formatHrmPerformanceRaterType,
} from '#/views/hrm/utils/format-performance';

import { useReviewStageGridColumns } from '../../data';

defineOptions({ name: 'HrmPerformancePlanDetailsInfo' });

const props = defineProps<{
  plan: HrmPerformancePlanApi.PerformancePlan;
}>();

const activeNames = ref(['basicInfo', 'reviewStages']);

const [ReviewGrid, reviewGridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useReviewStageGridColumns(),
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'name', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>,
});

watch(
  () => props.plan.reviewStages,
  async (rows) => {
    await nextTick();
    await reviewGridApi.grid.reloadData(rows || []);
  },
  { immediate: true },
);
</script>

<template>
  <ElCollapse v-model="activeNames">
    <ElCollapseItem name="basicInfo" title="考核设置">
      <ElDescriptions :column="3" border>
        <ElDescriptionsItem label="考核模板">
          {{ plan.assessmentTemplateName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="结果模板">
          {{ plan.resultTemplateName || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="考核周期">
          {{ formatHrmPerformancePlanCycle(plan) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="3" label="结果等级">
          {{
            plan.resultConfig?.levels
              ?.map(
                (level) =>
                  `${level.name}（${level.minScore}-${level.maxScore}，系数 ${level.coefficient}）`,
              )
              .join('；') || '-'
          }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="开始日期">
          {{ formatHrmDate(plan.startTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="结束日期">
          {{ formatHrmDate(plan.endTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="计薪月份">
          {{ plan.paidForMonth || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="plan.terminateTime" label="终止时间">
          {{ formatDateTime(plan.terminateTime) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="指标制定">
          {{ formatHrmPerformanceQuotaSettingType(plan.quotaSettingType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="目标确认">
          {{ plan.targetConfirmation ? '需要' : '不需要' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="同步薪资">
          {{ plan.syncToSalary ? '是' : '否' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="结果审核">
          {{ plan.resultAudit ? '需要' : '不需要' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="结果确认">
          {{ plan.resultConfirmation ? '需要' : '不需要' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="申诉超期处理">
          {{ formatHrmPerformanceAppealTimeout(plan) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="3" label="考核说明">
          {{ plan.description || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCollapseItem>
    <ElCollapseItem name="reviewStages" title="评分流程">
      <ReviewGrid class="w-full">
        <template #raterType="{ row }">
          {{ formatHrmPerformanceRaterType(row.rater?.type) }}
        </template>
        <template #weight="{ row }">{{ row.weight || 0 }}%</template>
      </ReviewGrid>
    </ElCollapseItem>
  </ElCollapse>
</template>
