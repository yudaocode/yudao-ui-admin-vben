<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Card, Descriptions, DescriptionsItem, Table } from 'antdv-next';

import { getSalaryEmployeeMonthRecordPage } from '#/api/hrm/salary/month-record/employee';
import { HrmSalaryMonthStatus } from '#/views/hrm/utils/constants';
import { formatHrmMoney, formatHrmYearMonth } from '#/views/hrm/utils/format';

const props = defineProps<{ employeeId: number }>();

const loading = ref(false);
const total = ref(0);
const list = ref<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord[]>(
  [],
);
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
});

const detail = ref<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord>();
const historyColumns: TableColumnsType<HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord> =
  [
    { title: '计薪月份', key: 'yearMonth', width: 110 },
    { title: '计薪周期', key: 'workDays', minWidth: 150 },
    {
      title: '应发工资',
      key: 'expectedPaySalary',
      align: 'right',
      width: 130,
    },
    {
      title: '个人所得税',
      key: 'personalTax',
      align: 'right',
      width: 130,
    },
    {
      title: '实发工资',
      key: 'realPaySalary',
      align: 'right',
      width: 130,
    },
    { title: '操作', key: 'actions', align: 'center', width: 80 },
  ];
const optionColumns: TableColumnsType<HrmSalaryMonthEmployeeRecordApi.OptionValue> =
  [
    { title: '工资项', dataIndex: 'name', key: 'name', minWidth: 180 },
    { title: '金额', key: 'value', align: 'right', width: 140 },
  ];

const [DetailModal, detailModalApi] = useVbenModal({
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detail.value = undefined;
    }
  },
});

/** 查询历史月度工资 */
async function getList() {
  loading.value = true;
  try {
    const data = await getSalaryEmployeeMonthRecordPage({
      ...queryParams,
      employeeId: props.employeeId,
      monthRecordStatus: HrmSalaryMonthStatus.HISTORY,
    });
    list.value = data.list;
    total.value = data.total;
  } finally {
    loading.value = false;
  }
}

/** 打开工资明细 */
function openDetail(
  row: HrmSalaryMonthEmployeeRecordApi.SalaryMonthEmployeeRecord,
) {
  detail.value = row;
  detailModalApi.open();
}

/** 分页变化 */
function handleTableChange(pagination: {
  current?: number;
  pageSize?: number;
}) {
  queryParams.pageNo = pagination.current ?? 1;
  queryParams.pageSize = pagination.pageSize ?? 10;
  getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <Card title="历史月度工资" :style="{ marginBottom: '15px' }">
    <Table
      bordered
      size="small"
      :loading="loading"
      :data-source="list"
      :pagination="{
        current: queryParams.pageNo,
        pageSize: queryParams.pageSize,
        total,
        showSizeChanger: true,
      }"
      :row-key="(record) => record.id ?? `${record.year}-${record.month}`"
      :columns="historyColumns"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'yearMonth'">
          {{ formatHrmYearMonth(record.year, record.month) }}
        </template>
        <template v-else-if="column.key === 'workDays'">
          {{ record.actualWorkDay ?? '-' }} / {{ record.needWorkDay ?? '-' }} 天
        </template>
        <template v-else-if="column.key === 'expectedPaySalary'">
          {{ formatHrmMoney(record.expectedPaySalary) }}
        </template>
        <template v-else-if="column.key === 'personalTax'">
          {{ formatHrmMoney(record.personalTax) }}
        </template>
        <template v-else-if="column.key === 'realPaySalary'">
          {{ formatHrmMoney(record.realPaySalary) }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a @click="openDetail(record)">详情</a>
        </template>
      </template>
    </Table>

    <DetailModal
      title="工资明细"
      class="w-[620px]"
      :show-confirm-button="false"
    >
      <Descriptions v-if="detail" bordered :column="2" size="small">
        <DescriptionsItem label="计薪月份">
          {{ formatHrmYearMonth(detail.year, detail.month) }}
        </DescriptionsItem>
        <DescriptionsItem label="出勤天数">
          {{ detail.actualWorkDay ?? '-' }} / {{ detail.needWorkDay ?? '-' }} 天
        </DescriptionsItem>
        <DescriptionsItem label="应发工资">
          {{ formatHrmMoney(detail.expectedPaySalary) }}
        </DescriptionsItem>
        <DescriptionsItem label="个人所得税">
          {{ formatHrmMoney(detail.personalTax) }}
        </DescriptionsItem>
        <DescriptionsItem label="实发工资" :span="2">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </DescriptionsItem>
      </Descriptions>
      <Table
        v-if="detail?.optionValues?.length"
        bordered
        size="small"
        class="mt-4"
        :columns="optionColumns"
        :data-source="detail.optionValues"
        :pagination="false"
        :row-key="(row) => row.code ?? row.name ?? ''"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'value'">
            {{ formatHrmMoney(record.value) }}
          </template>
        </template>
      </Table>
    </DetailModal>
  </Card>
</template>
