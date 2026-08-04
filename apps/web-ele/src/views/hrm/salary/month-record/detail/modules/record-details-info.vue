<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { ElCard, ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

defineProps<{
  record: HrmSalaryMonthRecordApi.SalaryMonthRecord;
}>();
</script>

<template>
  <ElCard class="mb-4">
    <ElDescriptions border :column="3" size="small">
      <ElDescriptionsItem label="月份">
        {{ formatHrmYearMonth(record.year, record.month) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="计薪人数">
        {{ record.employeeCount ?? 0 }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="应发工资">
        {{ formatHrmMoney(record.expectedPaySalary) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="实发工资">
        {{ formatHrmMoney(record.realPaySalary) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="个人社保">
        {{ formatHrmMoney(record.personalInsuranceAmount) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="个人公积金">
        {{ formatHrmMoney(record.personalProvidentFundAmount) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="个人所得税">
        {{ formatHrmMoney(record.personalTax) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="公司社保">
        {{ formatHrmMoney(record.corporateInsuranceAmount) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="公司公积金">
        {{ formatHrmMoney(record.corporateProvidentFundAmount) }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElCard>
</template>
