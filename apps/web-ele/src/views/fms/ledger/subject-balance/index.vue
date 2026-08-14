<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { ElButton, ElCard } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportLedgerSubjectBalance,
  getLedgerSubjectBalanceList,
} from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_SUBJECT_BALANCE_NODE_TYPE,
  FMS_SUBJECT_LEVEL_MAX,
} from '#/views/fms/utils/constants';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import {
  flattenSubjectBalanceTree,
  type SubjectBalanceRow,
  useGridColumns,
} from './data';

defineOptions({ name: 'FmsSubjectBalance' });

const router = useRouter();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const isExpandAll = ref(false); // 是否展开所有级次
const currentMonth = formatDate(new Date(), 'YYYY-MM'); // 当前月份
const queryParams = reactive<FmsLedgerApi.ListReq>({
  accountSetId: 0,
  startMonth: currentMonth,
  endMonth: currentMonth,
  minLevel: 1,
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
          const tree = await getLedgerSubjectBalanceList(queryParams);
          const list = flattenSubjectBalanceTree(tree);
          return { list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'nodeKey' },
    toolbarConfig: { refresh: true },
    treeConfig: {
      parentField: 'parentNodeKey',
      rowField: 'nodeKey',
      transform: true,
    },
  } as VxeTableGridOptions<SubjectBalanceRow>,
});

watch(accountSetId, () => init());

/** 初始化科目余额表页面 */
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

/** 展开或折叠全部科目 */
async function toggleExpandAll() {
  isExpandAll.value = !isExpandAll.value;
  await gridApi.grid?.setAllTreeExpand(isExpandAll.value);
}

/** 打印前展开所有级次 */
async function expandBalanceForPrint() {
  isExpandAll.value = true;
  await gridApi.grid?.setAllTreeExpand(true);
}

/** 打开科目明细账 */
function openDetail(row: SubjectBalanceRow) {
  router.push({
    path: '/fms/ledger/detail',
    query: {
      subjectId: row.subjectId,
      startMonth: queryParams.startMonth,
      endMonth: queryParams.endMonth,
    },
  });
}

/** 导出科目余额表 */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportLedgerSubjectBalance(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '科目余额表',
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
          :before-print="expandBalanceForPrint"
          :end-month="queryParams.endMonth"
          :export-loading="exportLoading"
          :max-level="FMS_SUBJECT_LEVEL_MAX"
          permission-prefix="fms:ledger:subject-balance"
          print-target="fms-subject-balance-table"
          print-title="科目余额表"
          :start-month="queryParams.startMonth"
          @export="handleExport"
          @search="handleQuery"
        >
          <template #actions>
            <ElButton type="danger" plain @click="toggleExpandAll">
              <IconifyIcon class="mr-1" icon="lucide:chevrons-up-down" />
              展开/折叠
            </ElButton>
          </template>
        </FmsLedgerSearchBar>
      </ElCard>

      <!-- 列表 -->
      <div class="min-h-0 flex-1">
        <Grid id="fms-subject-balance-table">
          <template #subjectCode="{ row }">
            <ElButton
              v-if="row.nodeType === FMS_SUBJECT_BALANCE_NODE_TYPE.SUBJECT"
              link
              type="primary"
              class="!p-0"
              @click="openDetail(row)"
            >
              {{ row.subjectCode }}
            </ElButton>
            <span v-else>{{ row.subjectCode }}</span>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
