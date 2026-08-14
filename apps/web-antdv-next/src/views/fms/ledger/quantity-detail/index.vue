<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import {
  downloadFileFromBlobPart,
  formatDate,
  handleTree,
  traverseTreeValues,
} from '@vben/utils';

import { Button, Card } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSubjectSimpleList } from '#/api/fms/config/subject';
import {
  exportLedgerQuantityDetail,
  getLedgerQuantityDetailList,
} from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import {
  filterQuantitySubjects,
  getLedgerRowClassName,
  useGridColumns,
} from './data';

defineOptions({ name: 'FmsQuantityDetailLedger' });

const router = useRouter();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const quantitySubjects = ref<FmsSubjectApi.Subject[]>([]); // 数量核算科目树
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const queryParams = reactive<FmsLedgerApi.ListReq>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth,
});
const exportLoading = ref(false); // 导出的加载中

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!accountSetId.value || !queryParams.subjectId) {
            return { list: [], total: 0 };
          }
          const list = await getLedgerQuantityDetailList(queryParams);
          return { list, total: list.length };
        },
      },
    },
    rowClassName: getLedgerRowClassName,
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.Detail>,
});

watch(accountSetId, () => init());

/** 初始化数量金额明细账页面 */
async function init() {
  if (!accountSetId.value) {
    quantitySubjects.value = [];
    await gridApi.reload();
    return;
  }
  queryParams.accountSetId = accountSetId.value;
  const [subjectList, accountingMonth] = await Promise.all([
    getSubjectSimpleList(accountSetId.value),
    fmsStore.loadCurrentMonth(),
  ]);
  quantitySubjects.value = filterQuantitySubjects(handleTree(subjectList));
  if (accountingMonth) {
    queryParams.startMonth = accountingMonth;
    queryParams.endMonth = accountingMonth;
  }
  queryParams.subjectId = traverseTreeValues(
    quantitySubjects.value,
    (subject) => subject.id!,
  )[0];
  await gridApi.reload();
}

/** 处理查询条件变化 */
function handleQuery(value: Omit<FmsLedgerApi.ListReq, 'accountSetId'>) {
  Object.assign(queryParams, value, { accountSetId: accountSetId.value || 0 });
  gridApi.reload();
}

/** 打开凭证详情 */
function openVoucher(row: FmsLedgerApi.Detail) {
  router.push({ path: '/fms/voucher/create', query: { id: row.voucherId } });
}

/** 导出数量金额明细账 */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportLedgerQuantityDetail(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '数量金额明细账',
        queryParams.startMonth,
        queryParams.endMonth,
      ),
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  init();
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【账簿】账簿管理"
        url="https://doc.iocoder.cn/fms/ledger/"
      />
    </template>
    <div class="flex h-full flex-col">
      <!-- 搜索工作栏 -->
      <Card class="mb-4 shrink-0">
        <FmsLedgerSearchBar
          :end-month="queryParams.endMonth"
          :export-loading="exportLoading"
          permission-prefix="fms:ledger:detail"
          print-target="fms-quantity-detail-ledger-table"
          print-title="数量金额明细账"
          :show-subject="true"
          :start-month="queryParams.startMonth"
          :subject-id="queryParams.subjectId"
          :subjects="quantitySubjects"
          @export="handleExport"
          @search="handleQuery"
        />
      </Card>

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid id="fms-quantity-detail-ledger-table">
          <template #voucherNumber="{ row }">
            <Button
              v-if="row.voucherId"
              v-access:code="['fms:voucher:query']"
              type="link"
              class="!p-0"
              @click="openVoucher(row)"
            >
              {{ row.voucherNumber }}
            </Button>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.fms-ledger-summary-row) {
  font-weight: 600;
  background-color: hsl(var(--muted));
}
</style>
