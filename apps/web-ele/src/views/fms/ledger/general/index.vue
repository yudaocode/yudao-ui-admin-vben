<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { ElButton, ElCard } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportLedgerGeneral, getLedgerGeneralList } from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import { buildSpanMethod, useGridColumns } from './data';

defineOptions({ name: 'FmsGeneralLedger' });

const router = useRouter();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const list = ref<FmsLedgerApi.General[]>([]); // 总账列表
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const queryParams = reactive<FmsLedgerApi.ListReq>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth,
  minLevel: 1,
  maxLevel: 1,
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
          if (!accountSetId.value) {
            list.value = [];
            return { list: [], total: 0 };
          }
          list.value = await getLedgerGeneralList(queryParams);
          return { list: list.value, total: list.value.length };
        },
      },
    },
    rowClassName: () => 'font-medium',
    spanMethod: buildSpanMethod(() => list.value),
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.General>,
});

watch(accountSetId, () => init());

/** 初始化总账页面 */
async function init() {
  if (!accountSetId.value) {
    list.value = [];
    await gridApi.reload();
    return;
  }
  queryParams.accountSetId = accountSetId.value;
  const accountingMonth = await fmsStore.loadCurrentMonth();
  if (accountingMonth) {
    queryParams.startMonth = accountingMonth;
    queryParams.endMonth = accountingMonth;
  }
  await gridApi.reload();
}

/** 处理查询条件变化 */
function handleQuery(value: Omit<FmsLedgerApi.ListReq, 'accountSetId'>) {
  Object.assign(queryParams, value, { accountSetId: accountSetId.value || 0 });
  gridApi.reload();
}

/** 打开科目明细账 */
function openDetail(row: FmsLedgerApi.General) {
  router.push({
    path: '/fms/ledger/detail',
    query: {
      subjectId: row.subjectId,
      startMonth: queryParams.startMonth,
      endMonth: queryParams.endMonth,
    },
  });
}

/** 导出总账 */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportLedgerGeneral(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '总账',
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
      <ElCard class="mb-4 shrink-0">
        <FmsLedgerSearchBar
          :end-month="queryParams.endMonth"
          :export-loading="exportLoading"
          permission-prefix="fms:ledger:general"
          print-target="fms-general-ledger-table"
          print-title="总账"
          :start-month="queryParams.startMonth"
          @export="handleExport"
          @search="handleQuery"
        />
      </ElCard>

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid id="fms-general-ledger-table">
          <template #subjectCode="{ row }">
            <ElButton link type="primary" class="!p-0" @click="openDetail(row)">
              {{ row.subjectCode }}
            </ElButton>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
