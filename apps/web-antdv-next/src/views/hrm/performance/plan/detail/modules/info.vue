<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { ref } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Collapse,
  CollapsePanel,
  Descriptions,
  DescriptionsItem,
  Table,
} from 'antdv-next';

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

const activeKeys = ref(['basicInfo', 'reviewStages']);

const reviewColumns = [
  { title: '顺序', key: 'index', width: 70, align: 'center' as const },
  { title: '评分阶段', dataIndex: 'name', minWidth: 150 },
  { title: '评分人类型', key: 'raterType', minWidth: 130 },
  { title: '权重', key: 'weight', width: 90, align: 'center' as const },
  {
    title: '评语必填',
    key: 'requiredSetting',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '允许驳回',
    key: 'rejectAuthority',
    width: 100,
    align: 'center' as const,
  },
];
</script>

<template>
  <Collapse v-model:active-key="activeKeys">
    <CollapsePanel key="basicInfo" header="考核设置">
      <Descriptions :column="3" bordered>
        <DescriptionsItem label="考核模板">
          {{ plan.assessmentTemplateName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="结果模板">
          {{ plan.resultTemplateName || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="考核周期">
          {{ formatHrmPerformancePlanCycle(plan) }}
        </DescriptionsItem>
        <DescriptionsItem :span="3" label="结果等级">
          {{
            plan.resultConfig?.levels
              ?.map(
                (level) =>
                  `${level.name}（${level.minScore}-${level.maxScore}，系数 ${level.coefficient}）`,
              )
              .join('；') || '-'
          }}
        </DescriptionsItem>
        <DescriptionsItem label="开始日期">
          {{ formatHrmDate(plan.startTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="结束日期">
          {{ formatHrmDate(plan.endTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="计薪月份">
          {{ plan.paidForMonth || '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="plan.terminateTime" label="终止时间">
          {{ formatDateTime(plan.terminateTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="指标制定">
          {{ formatHrmPerformanceQuotaSettingType(plan.quotaSettingType) }}
        </DescriptionsItem>
        <DescriptionsItem label="目标确认">
          {{ plan.targetConfirmation ? '需要' : '不需要' }}
        </DescriptionsItem>
        <DescriptionsItem label="同步薪资">
          {{ plan.syncToSalary ? '是' : '否' }}
        </DescriptionsItem>
        <DescriptionsItem label="结果审核">
          {{ plan.resultAudit ? '需要' : '不需要' }}
        </DescriptionsItem>
        <DescriptionsItem label="结果确认">
          {{ plan.resultConfirmation ? '需要' : '不需要' }}
        </DescriptionsItem>
        <DescriptionsItem label="申诉超期处理">
          {{ formatHrmPerformanceAppealTimeout(plan) }}
        </DescriptionsItem>
        <DescriptionsItem :span="3" label="考核说明">
          {{ plan.description || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </CollapsePanel>
    <CollapsePanel key="reviewStages" header="评分流程">
      <Table
        :columns="reviewColumns"
        :data-source="plan.reviewStages || []"
        :pagination="false"
        bordered
        size="small"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'raterType'">
            {{ formatHrmPerformanceRaterType(record.rater?.type) }}
          </template>
          <template v-else-if="column.key === 'weight'">
            {{ record.weight || 0 }}%
          </template>
          <template v-else-if="column.key === 'requiredSetting'">
            {{ record.requiredSetting ? '是' : '否' }}
          </template>
          <template v-else-if="column.key === 'rejectAuthority'">
            {{ record.rejectAuthority ? '是' : '否' }}
          </template>
        </template>
      </Table>
    </CollapsePanel>
  </Collapse>
</template>
