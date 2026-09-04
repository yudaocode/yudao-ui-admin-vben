<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { DICT_TYPE } from '@vben/constants';

import { Card } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSalaryChangeRecordList } from '#/api/hrm/salary/change-record';
import { DictTag } from '#/components/dict-tag';
import { HrmSalaryRecordType } from '#/views/hrm/utils/constants';

import { useSalaryChangeRecordGridColumns } from '../data';

const props = defineProps<{ employeeId: number }>();

const [Grid] = useVbenVxeGrid({
  gridOptions: {
    columns: useSalaryChangeRecordGridColumns(),
    minHeight: 220,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getSalaryChangeRecordList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmSalaryChangeRecordApi.SalaryChangeRecord>,
});
</script>

<template>
  <Card title="定薪/调薪记录" :style="{ marginBottom: '15px' }">
    <Grid>
      <template #recordType="{ row }">
        {{ row.recordType === HrmSalaryRecordType.FIXED ? '定薪' : '调薪' }}
      </template>
      <template #changeReason="{ row }">
        <DictTag
          v-if="row.changeReason !== null"
          :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
          :value="row.changeReason"
        />
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <DictTag
          v-if="row.status !== null"
          :type="DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS"
          :value="row.status"
        />
        <span v-else>-</span>
      </template>
    </Grid>
  </Card>
</template>
