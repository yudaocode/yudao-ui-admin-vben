<script lang="ts" setup>
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Card, Descriptions, Table } from 'ant-design-vue';

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
      :row-key="(record) => record.id!"
      @change="handleTableChange"
    >
      <Table.Column title="计薪月份" data-index="year" width="110">
        <template #default="{ record }">
          {{ formatHrmYearMonth(record.year, record.month) }}
        </template>
      </Table.Column>
      <Table.Column
        title="计薪周期"
        data-index="actualWorkDay"
        :min-width="150"
      >
        <template #default="{ record }">
          {{ record.actualWorkDay ?? '-' }} / {{ record.needWorkDay ?? '-' }} 天
        </template>
      </Table.Column>
      <Table.Column
        title="应发工资"
        data-index="expectedPaySalary"
        align="right"
        width="130"
      >
        <template #default="{ record }">
          {{ formatHrmMoney(record.expectedPaySalary) }}
        </template>
      </Table.Column>
      <Table.Column
        title="个人所得税"
        data-index="personalTax"
        align="right"
        width="130"
      >
        <template #default="{ record }">
          {{ formatHrmMoney(record.personalTax) }}
        </template>
      </Table.Column>
      <Table.Column
        title="实发工资"
        data-index="realPaySalary"
        align="right"
        width="130"
      >
        <template #default="{ record }">
          {{ formatHrmMoney(record.realPaySalary) }}
        </template>
      </Table.Column>
      <Table.Column title="操作" align="center" width="80">
        <template #default="{ record }">
          <a @click="openDetail(record)">详情</a>
        </template>
      </Table.Column>
    </Table>

    <DetailModal
      title="工资明细"
      class="w-[620px]"
      :show-confirm-button="false"
    >
      <Descriptions v-if="detail" bordered :column="2" size="small">
        <Descriptions.Item label="计薪月份">
          {{ formatHrmYearMonth(detail.year, detail.month) }}
        </Descriptions.Item>
        <Descriptions.Item label="出勤天数">
          {{ detail.actualWorkDay ?? '-' }} / {{ detail.needWorkDay ?? '-' }} 天
        </Descriptions.Item>
        <Descriptions.Item label="应发工资">
          {{ formatHrmMoney(detail.expectedPaySalary) }}
        </Descriptions.Item>
        <Descriptions.Item label="个人所得税">
          {{ formatHrmMoney(detail.personalTax) }}
        </Descriptions.Item>
        <Descriptions.Item label="实发工资" :span="2">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </Descriptions.Item>
      </Descriptions>
      <Table
        v-if="detail?.optionValues?.length"
        bordered
        size="small"
        class="mt-4"
        :data-source="detail.optionValues"
        :pagination="false"
        :row-key="(row) => row.code ?? row.name"
      >
        <Table.Column title="工资项" data-index="name" :min-width="180" />
        <Table.Column title="金额" data-index="value" align="right" width="140">
          <template #default="{ record }">
            {{ formatHrmMoney(record.value) }}
          </template>
        </Table.Column>
      </Table>
    </DetailModal>
  </Card>
</template>
