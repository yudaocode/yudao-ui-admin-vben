<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  ElCollapse,
  ElCollapseItem,
  ElDescriptions,
  ElDescriptionsItem,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { formatHrmDate } from '#/views/hrm/utils/format';
import {
  formatHrmPerformanceAppealTimeout,
  formatHrmPerformancePlanCycle,
  formatHrmPerformanceQuotaSettingType,
  formatHrmPerformanceRaterType,
} from '#/views/hrm/utils/format-performance';

defineOptions({ name: 'HrmPerformancePlanDetailsInfo' });

defineProps<{
  plan: HrmPerformancePlanApi.PerformancePlan;
}>();

const activeNames = ref(['basicInfo', 'reviewStages']);
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
      <ElTable :data="plan.reviewStages || []" border>
        <ElTableColumn align="center" label="顺序" width="70">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </ElTableColumn>
        <ElTableColumn label="评分阶段" min-width="150" prop="name" />
        <ElTableColumn label="评分人类型" min-width="130">
          <template #default="{ row }">
            {{ formatHrmPerformanceRaterType(row.rater?.type) }}
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" label="权重" width="90">
          <template #default="{ row }">{{ row.weight || 0 }}%</template>
        </ElTableColumn>
        <ElTableColumn align="center" label="评语必填" width="100">
          <template #default="{ row }">
            {{ row.requiredSetting ? '是' : '否' }}
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" label="允许驳回" width="100">
          <template #default="{ row }">
            {{ row.rejectAuthority ? '是' : '否' }}
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCollapseItem>
  </ElCollapse>
</template>
