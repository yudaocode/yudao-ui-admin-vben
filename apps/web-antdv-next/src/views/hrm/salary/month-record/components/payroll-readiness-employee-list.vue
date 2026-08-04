<script lang="ts" setup>
import type { HrmSalaryMonthRecordApi } from '#/api/hrm/salary/month-record';

import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { Table } from 'antdv-next';

import { DictTag } from '#/components/dict-tag';

defineOptions({ name: 'HrmSalaryPayrollReadinessEmployeeList' });

defineProps<{
  list?: HrmSalaryMonthRecordApi.PayrollReadinessEmployee[];
}>();

const columns = [
  { dataIndex: 'employeeName', title: '员工姓名', width: 130 },
  { dataIndex: 'jobNumber', title: '工号', width: 120 },
  { dataIndex: 'deptName', title: '部门', width: 130 },
  { dataIndex: 'postName', title: '岗位', width: 130 },
  { dataIndex: 'status', title: '员工状态', width: 100 },
  { dataIndex: 'entryTime', title: '入职日期', width: 110 },
];
</script>

<template>
  <Table
    :columns="columns"
    :data-source="list || []"
    :pagination="false"
    :scroll="{ y: 480 }"
    bordered
    row-key="employeeId"
    size="small"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.dataIndex === 'status'">
        <DictTag
          v-if="record.status != null"
          :type="DICT_TYPE.HRM_EMPLOYEE_STATUS"
          :value="record.status"
        />
        <span v-else>-</span>
      </template>
      <template v-else-if="column.dataIndex === 'entryTime'">
        {{ record.entryTime ? formatDateTime(record.entryTime) : '-' }}
      </template>
    </template>
  </Table>
</template>
