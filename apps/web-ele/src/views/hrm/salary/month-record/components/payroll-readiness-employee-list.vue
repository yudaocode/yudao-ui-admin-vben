<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { ElTable, ElTableColumn } from 'element-plus';

import { DictTag } from '#/components/dict-tag';

defineOptions({ name: 'HrmSalaryPayrollReadinessEmployeeList' });

defineProps<{
  list?: HrmSalaryMonthRecordApi.PayrollReadinessEmployee[];
}>();
</script>

<template>
  <ElTable
    :data="list || []"
    border
    max-height="480"
    row-key="employeeId"
    size="small"
  >
    <ElTableColumn label="员工姓名" min-width="130" prop="employeeName" />
    <ElTableColumn label="工号" prop="jobNumber" width="120" />
    <ElTableColumn label="部门" min-width="130" prop="deptName" />
    <ElTableColumn label="岗位" min-width="130" prop="postName" />
    <ElTableColumn align="center" label="员工状态" width="100">
      <template #default="{ row }">
        <DictTag
          v-if="row.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="row.status"
        />
        <span v-else>-</span>
      </template>
    </ElTableColumn>
    <ElTableColumn align="center" label="入职日期" width="110">
      <template #default="{ row }">
        {{ row.entryTime ? formatDateTime(row.entryTime) : '-' }}
      </template>
    </ElTableColumn>
  </ElTable>
</template>
