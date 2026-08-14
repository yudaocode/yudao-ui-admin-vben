<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { Card } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportLedgerQuantityGeneral,
  getLedgerQuantityGeneralList,
} from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_SUBJECT_LEVEL_MAX,
  FMS_SUBJECT_LEVEL_MIN,
} from '#/views/fms/utils/constants';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import { flattenBalanceTree, useGridColumns } from './data';

defineOptions({ name: 'FmsQuantityGeneralLedger' });

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const queryParams = reactive<FmsLedgerApi.ListReq>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth,
  minLevel: FMS_SUBJECT_LEVEL_MIN,
  maxLevel: FMS_SUBJECT_LEVEL_MAX,
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
            return { list: [], total: 0 };
          }
          const list = flattenBalanceTree(
            await getLedgerQuantityGeneralList(queryParams),
          );
          return { list, total: list.length };
        },
      },
    },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.SubjectBalance>,
});

watch(accountSetId, () => init());

/** 初始化数量金额总账页面 */
async function init() {
  if (!accountSetId.value) {
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

/** 导出数量金额总账 */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportLedgerQuantityGeneral(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '数量金额总账',
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
          :max-level="FMS_SUBJECT_LEVEL_MAX"
          permission-prefix="fms:ledger:general"
          print-target="fms-quantity-general-ledger-table"
          print-title="数量金额总账"
          :start-month="queryParams.startMonth"
          @export="handleExport"
          @search="handleQuery"
        />
      </Card>

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid id="fms-quantity-general-ledger-table" />
      </div>
    </div>
  </Page>
</template>
