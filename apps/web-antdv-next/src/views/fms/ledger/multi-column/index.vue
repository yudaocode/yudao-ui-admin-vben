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
import { exportLedgerMultiColumn, getLedgerMultiColumn } from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import {
  buildMultiColumnColumns,
  filterParentSubjects,
  getLedgerRowClassName,
  useGridColumns,
} from './data';

defineOptions({ name: 'FmsMultiColumnLedger' });

const router = useRouter();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const subjects = ref<FmsSubjectApi.Subject[]>([]); // 会计科目树
const multiColumnSubjects = computed(() => filterParentSubjects(subjects.value)); // 含下级科目的科目树
const result = reactive<FmsLedgerApi.MultiColumn>({ columns: [], rows: [] }); // 多栏账查询结果
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
            result.columns = [];
            result.rows = [];
            return { list: [], total: 0 };
          }
          Object.assign(result, await getLedgerMultiColumn(queryParams));
          gridApi.setGridOptions({
            columns: buildMultiColumnColumns(result.columns),
          });
          return { list: result.rows, total: result.rows.length };
        },
      },
    },
    rowClassName: getLedgerRowClassName,
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.Detail>,
});

watch(accountSetId, () => init());

/** 初始化多栏账页面 */
async function init() {
  if (!accountSetId.value) {
    subjects.value = [];
    result.columns = [];
    result.rows = [];
    await gridApi.reload();
    return;
  }
  queryParams.accountSetId = accountSetId.value;
  const [subjectList, accountingMonth] = await Promise.all([
    getSubjectSimpleList(accountSetId.value),
    fmsStore.loadCurrentMonth(),
  ]);
  subjects.value = handleTree(subjectList);
  if (accountingMonth) {
    queryParams.startMonth = accountingMonth;
    queryParams.endMonth = accountingMonth;
  }
  queryParams.subjectId = traverseTreeValues(
    multiColumnSubjects.value,
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

/** 导出多栏账 */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportLedgerMultiColumn(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '多栏账',
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
          permission-prefix="fms:ledger:multi-column"
          print-target="fms-multi-column-ledger-table"
          print-title="多栏账"
          :subjects="multiColumnSubjects"
          :show-subject="true"
          :auto-query="true"
          :start-month="queryParams.startMonth"
          :subject-id="queryParams.subjectId"
          @export="handleExport"
          @search="handleQuery"
        />
      </Card>

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid id="fms-multi-column-ledger-table">
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
