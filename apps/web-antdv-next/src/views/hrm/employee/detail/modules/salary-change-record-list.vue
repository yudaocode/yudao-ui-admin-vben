<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Card, Table } from 'antdv-next';

import { getSalaryChangeRecordList } from '#/api/hrm/salary/change-record';
import { DictTag } from '#/components/dict-tag';
import { HrmSalaryRecordType } from '#/views/hrm/utils/constants';
import { formatHrmDateTime, formatHrmMoney } from '#/views/hrm/utils/format';

const props = defineProps<{ employeeId: number }>();
const loading = ref(false);
const list = ref<HrmSalaryChangeRecordApi.SalaryChangeRecord[]>([]);

const columns: TableColumnsType<HrmSalaryChangeRecordApi.SalaryChangeRecord> = [
  {
    title: '生效日期',
    dataIndex: 'effectTime',
    key: 'effectTime',
    width: 120,
  },
  {
    title: '类型',
    key: 'recordType',
    width: 90,
  },
  {
    title: '原因',
    key: 'changeReason',
    width: 90,
  },
  {
    title: '调整前',
    key: 'beforeTotal',
    align: 'right',
    width: 120,
  },
  {
    title: '调整后',
    key: 'afterTotal',
    align: 'right',
    width: 120,
  },
  {
    title: '试用调整前',
    key: 'probationBeforeTotal',
    align: 'right',
    width: 120,
  },
  {
    title: '试用调整后',
    key: 'probationAfterTotal',
    align: 'right',
    width: 120,
  },
  {
    title: '状态',
    key: 'status',
    width: 110,
  },
  { title: '备注', dataIndex: 'remark', minWidth: 160 },
];

onMounted(async () => {
  loading.value = true;
  try {
    list.value = await getSalaryChangeRecordList(props.employeeId);
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <Card title="定薪/调薪记录" :style="{ marginBottom: '15px' }">
    <Table
      bordered
      size="small"
      :loading="loading"
      :data-source="list"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1100 }"
      :columns="columns"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'effectTime'">
          {{ formatHrmDateTime(record.effectTime) }}
        </template>
        <template v-else-if="column.key === 'recordType'">
          {{
            record.recordType === HrmSalaryRecordType.FIXED ? '定薪' : '调薪'
          }}
        </template>
        <template v-else-if="column.key === 'changeReason'">
          <DictTag
            v-if="record.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="record.changeReason"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'beforeTotal'">
          {{ formatHrmMoney(record.beforeTotal) }}
        </template>
        <template v-else-if="column.key === 'afterTotal'">
          {{ formatHrmMoney(record.afterTotal) }}
        </template>
        <template v-else-if="column.key === 'probationBeforeTotal'">
          {{ formatHrmMoney(record.probationBeforeTotal) }}
        </template>
        <template v-else-if="column.key === 'probationAfterTotal'">
          {{ formatHrmMoney(record.probationAfterTotal) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <DictTag
            v-if="record.status != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS"
            :value="record.status"
          />
          <span v-else>-</span>
        </template>
      </template>
    </Table>
  </Card>
</template>
