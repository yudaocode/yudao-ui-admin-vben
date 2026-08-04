<script lang="ts" setup>
import { useAccess } from '@vben/access';

import InsuranceInfo from './insurance-info.vue';
import SalaryCardInfo from './salary-card-info.vue';
import SalaryChangeRecordList from './salary-change-record-list.vue';
import SalaryHistoryList from './salary-history-list.vue';
import SalaryInfo from './salary-info.vue';
defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();
</script>
<template>
  <SalaryInfo
    v-if="hasAccessByCodes(['hrm:salary:employee-info:query'])"
    :employee-id="employeeId"
  />
  <SalaryCardInfo :employee-id="employeeId" />
  <InsuranceInfo
    v-if="hasAccessByCodes(['hrm:insurance:employee-info:query'])"
    :employee-id="employeeId"
  />
  <SalaryHistoryList
    v-if="hasAccessByCodes(['hrm:salary:month-record:query'])"
    :employee-id="employeeId"
  />
  <SalaryChangeRecordList :employee-id="employeeId" />
</template>
