<script lang="ts" setup>
import type { HrmSalaryMonthEmployeeRecordApi } from '#/api/hrm/salary/month-record/employee';

import { onMounted, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElPagination,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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
function handlePageChange(pageNo: number) {
  queryParams.pageNo = pageNo;
  getList();
}

function handleSizeChange(pageSize: number) {
  queryParams.pageSize = pageSize;
  queryParams.pageNo = 1;
  getList();
}

onMounted(() => {
  getList();
});
</script>

<template>
  <ElCard :style="{ marginBottom: '15px' }" header="历史月度工资">
    <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
      <ElTableColumn label="计薪月份" width="110">
        <template #default="{ row }">
          {{ formatHrmYearMonth(row.year, row.month) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="计薪周期" min-width="150">
        <template #default="{ row }">
          {{ row.actualWorkDay ?? '-' }} / {{ row.needWorkDay ?? '-' }} 天
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="应发工资" width="130">
        <template #default="{ row }">
          {{ formatHrmMoney(row.expectedPaySalary) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="个人所得税" width="130">
        <template #default="{ row }">
          {{ formatHrmMoney(row.personalTax) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="实发工资" width="130">
        <template #default="{ row }">
          {{ formatHrmMoney(row.realPaySalary) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="80">
        <template #default="{ row }">
          <ElButton link type="primary" @click="openDetail(row)">详情</ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div class="mt-4 flex justify-end">
      <ElPagination
        v-model:current-page="queryParams.pageNo"
        v-model:page-size="queryParams.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="total"
        background
        layout="total, sizes, prev, pager, next"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>

    <DetailModal
      class="w-[620px]"
      title="工资明细"
      :show-confirm-button="false"
    >
      <ElDescriptions v-if="detail" :column="2" border size="small">
        <ElDescriptionsItem label="计薪月份">
          {{ formatHrmYearMonth(detail.year, detail.month) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="出勤天数">
          {{ detail.actualWorkDay ?? '-' }} / {{ detail.needWorkDay ?? '-' }} 天
        </ElDescriptionsItem>
        <ElDescriptionsItem label="应发工资">
          {{ formatHrmMoney(detail.expectedPaySalary) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="个人所得税">
          {{ formatHrmMoney(detail.personalTax) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem :span="2" label="实发工资">
          {{ formatHrmMoney(detail.realPaySalary) }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElTable
        v-if="detail?.optionValues?.length"
        class="mt-4"
        :data="detail.optionValues"
        border
        row-key="code"
        size="small"
      >
        <ElTableColumn label="工资项" min-width="180" prop="name" />
        <ElTableColumn align="right" label="金额" width="140">
          <template #default="{ row }">
            {{ formatHrmMoney(row.value) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </DetailModal>
  </ElCard>
</template>
