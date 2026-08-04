<script lang="ts" setup>
import type { HrmPerformancePlanApi } from '#/api/hrm/performance/plan';

import { DICT_TYPE } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Card, Descriptions } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDateRange,
  formatHrmPerformancePlanCycle,
} from '#/views/hrm/utils/format-performance';

defineOptions({ name: 'HrmPerformancePlanDetailsHeader' });

defineProps<{
  loading: boolean;
  plan: HrmPerformancePlanApi.PerformancePlan;
}>();

const emit = defineEmits<{ back: [] }>();
</script>

<template>
  <div>
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 items-start gap-2.5">
        <IconifyIcon
          class="mt-1 size-5 shrink-0 cursor-pointer"
          icon="lucide:arrow-left"
          title="返回"
          @click="emit('back')"
        />
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2.5">
            <span class="break-all text-xl font-bold">{{
              plan.name || '-'
            }}</span>
            <DictTag
              v-if="plan.status !== undefined && plan.status !== null"
              :type="DICT_TYPE.HRM_PERFORMANCE_PLAN_STATUS"
              :value="plan.status"
            />
            <DictTag
              v-if="plan.stageType !== undefined && plan.stageType !== null"
              :type="DICT_TYPE.HRM_PERFORMANCE_STAGE_STATUS"
              :value="plan.stageType"
            />
          </div>
          <div class="text-muted-foreground mt-1.5 text-sm">
            计划编号：{{ plan.id || '-' }}
          </div>
        </div>
      </div>
      <div>
        <slot></slot>
      </div>
    </div>
    <Card class="mt-2.5" :loading="loading">
      <Descriptions :column="5" bordered layout="vertical">
        <Descriptions.Item label="考核周期">
          {{ formatHrmPerformancePlanCycle(plan) }}
        </Descriptions.Item>
        <Descriptions.Item label="起止日期">
          {{ formatHrmDateRange(plan.startTime, plan.endTime) }}
        </Descriptions.Item>
        <Descriptions.Item label="考核模板">
          {{ plan.assessmentTemplateName || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="参评人数">
          {{ plan.employeeCount || 0 }}
        </Descriptions.Item>
        <Descriptions.Item label="完成人数">
          {{ plan.finishedCount || 0 }}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </div>
</template>
