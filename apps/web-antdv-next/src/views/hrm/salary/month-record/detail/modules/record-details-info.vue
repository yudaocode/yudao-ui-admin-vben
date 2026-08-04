<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { Card, Descriptions, DescriptionsItem } from 'antdv-next';

import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

defineProps<{
  record: HrmSalaryMonthRecordApi.SalaryMonthRecord;
}>();
</script>

<template>
  <Card class="mb-4">
    <Descriptions bordered :column="3" size="small">
      <DescriptionsItem label="月份">
        {{ formatHrmYearMonth(record.year, record.month) }}
      </DescriptionsItem>
      <DescriptionsItem label="计薪人数">
        {{ record.employeeCount ?? 0 }}
      </DescriptionsItem>
      <DescriptionsItem label="应发工资">
        {{ formatHrmMoney(record.expectedPaySalary) }}
      </DescriptionsItem>
      <DescriptionsItem label="实发工资">
        {{ formatHrmMoney(record.realPaySalary) }}
      </DescriptionsItem>
      <DescriptionsItem label="个人社保">
        {{ formatHrmMoney(record.personalInsuranceAmount) }}
      </DescriptionsItem>
      <DescriptionsItem label="个人公积金">
        {{ formatHrmMoney(record.personalProvidentFundAmount) }}
      </DescriptionsItem>
      <DescriptionsItem label="个人所得税">
        {{ formatHrmMoney(record.personalTax) }}
      </DescriptionsItem>
      <DescriptionsItem label="公司社保">
        {{ formatHrmMoney(record.corporateInsuranceAmount) }}
      </DescriptionsItem>
      <DescriptionsItem label="公司公积金">
        {{ formatHrmMoney(record.corporateProvidentFundAmount) }}
      </DescriptionsItem>
    </Descriptions>
  </Card>
</template>
