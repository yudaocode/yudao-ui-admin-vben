<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { Card, Descriptions } from 'ant-design-vue';

import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

defineProps<{
  record: HrmSalaryMonthRecordApi.SalaryMonthRecord;
}>();
</script>

<template>
  <Card class="mb-4">
    <Descriptions bordered :column="3" size="small">
      <Descriptions.Item label="月份">
        {{ formatHrmYearMonth(record.year, record.month) }}
      </Descriptions.Item>
      <Descriptions.Item label="计薪人数">
        {{ record.employeeCount ?? 0 }}
      </Descriptions.Item>
      <Descriptions.Item label="应发工资">
        {{ formatHrmMoney(record.expectedPaySalary) }}
      </Descriptions.Item>
      <Descriptions.Item label="实发工资">
        {{ formatHrmMoney(record.realPaySalary) }}
      </Descriptions.Item>
      <Descriptions.Item label="个人社保">
        {{ formatHrmMoney(record.personalInsuranceAmount) }}
      </Descriptions.Item>
      <Descriptions.Item label="个人公积金">
        {{ formatHrmMoney(record.personalProvidentFundAmount) }}
      </Descriptions.Item>
      <Descriptions.Item label="个人所得税">
        {{ formatHrmMoney(record.personalTax) }}
      </Descriptions.Item>
      <Descriptions.Item label="公司社保">
        {{ formatHrmMoney(record.corporateInsuranceAmount) }}
      </Descriptions.Item>
      <Descriptions.Item label="公司公积金">
        {{ formatHrmMoney(record.corporateProvidentFundAmount) }}
      </Descriptions.Item>
    </Descriptions>
  </Card>
</template>
