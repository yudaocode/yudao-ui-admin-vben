<script lang="ts" setup>
import type { TreeNodeData } from 'element-plus';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import {
  downloadFileFromBlobPart,
  formatDate,
  handleTree,
  traverseTreeValues,
} from '@vben/utils';

import { ElButton, ElCard, ElInput, ElTree } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDetailSubjectList } from '#/api/fms/config/subject';
import { exportLedgerDetail, getLedgerDetailList } from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import { getLedgerRowClassName, useGridColumns } from './data';

defineOptions({ name: 'FmsDetailLedger' });

const router = useRouter();
const route = useRoute();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const subjects = ref<FmsSubjectApi.Subject[]>([]); // 会计科目树
const subjectKeyword = ref(''); // 科目搜索关键字
const subjectTreeRef = ref<InstanceType<typeof ElTree>>(); // 科目树 Ref
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
          const list = await getLedgerDetailList(queryParams);
          return { list, total: list.length };
        },
      },
    },
    rowClassName: getLedgerRowClassName,
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<FmsLedgerApi.Detail>,
});

watch(accountSetId, () => init());
watch(subjectKeyword, (value) => subjectTreeRef.value?.filter(value));

/** 初始化明细账页面 */
async function init() {
  if (!accountSetId.value) {
    subjects.value = [];
    await gridApi.reload();
    return;
  }
  queryParams.accountSetId = accountSetId.value;
  const accountingMonth = await fmsStore.loadCurrentMonth();
  queryParams.startMonth = String(
    route.query.startMonth || accountingMonth || currentMonth,
  );
  queryParams.endMonth = String(
    route.query.endMonth || accountingMonth || currentMonth,
  );
  queryParams.subjectId = Number(route.query.subjectId) || 0;
  await loadSubjectTree();
  await gridApi.reload();
}

/** 按查询期间加载有发生额的科目树，并保留当前科目选择 */
async function loadSubjectTree() {
  if (!accountSetId.value) {
    subjects.value = [];
    return;
  }
  const subjectList = await getDetailSubjectList({
    accountSetId: accountSetId.value,
    startMonth: queryParams.startMonth,
    endMonth: queryParams.endMonth,
  });
  subjects.value = handleTree(subjectList);
  const subjectIds = traverseTreeValues(
    subjects.value,
    (subject) => subject.id!,
  );
  if (!queryParams.subjectId || !subjectIds.includes(queryParams.subjectId)) {
    queryParams.subjectId = subjectIds[0] || 0;
  }
  await nextTick();
  subjectTreeRef.value?.setCurrentKey(queryParams.subjectId);
}

/** 处理查询条件变化 */
async function handleQuery(value: Omit<FmsLedgerApi.ListReq, 'accountSetId'>) {
  const periodChanged =
    value.startMonth !== queryParams.startMonth ||
    value.endMonth !== queryParams.endMonth;
  Object.assign(queryParams, value, { accountSetId: accountSetId.value || 0 });
  if (periodChanged) {
    await loadSubjectTree();
  }
  if (queryParams.subjectId) {
    subjectTreeRef.value?.setCurrentKey(queryParams.subjectId);
  }
  await gridApi.reload();
}

/** 处理科目树点击 */
function handleSubjectClick(subject: FmsSubjectApi.Subject) {
  queryParams.subjectId = subject.id!;
  gridApi.reload();
}

/** 按编码或名称过滤科目 */
function filterSubject(value: string, data: TreeNodeData) {
  if (!value) return true;
  const subject = data as FmsSubjectApi.Subject;
  return `${subject.code} ${subject.name}`
    .toLowerCase()
    .includes(value.toLowerCase());
}

/** 获得科目展示文本 */
function getSubjectLabel(data: TreeNodeData) {
  const subject = data as FmsSubjectApi.Subject;
  return `${subject.code} ${subject.name}`;
}

/** 打开凭证详情 */
function openVoucher(row: FmsLedgerApi.Detail) {
  router.push({ path: '/fms/voucher/create', query: { id: row.voucherId } });
}

/** 导出明细账 */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportLedgerDetail(queryParams);
    downloadFileFromBlobPart({
      fileName: buildPeriodFilename(
        '明细账',
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
          permission-prefix="fms:ledger:detail"
          print-target="fms-detail-ledger-table"
          print-title="明细账"
          :subjects="subjects"
          :show-subject="true"
          :auto-query="true"
          :start-month="queryParams.startMonth"
          :subject-id="queryParams.subjectId"
          @export="handleExport"
          @search="handleQuery"
        />
      </ElCard>

      <!-- 科目树和明细账列表 -->
      <div class="flex min-h-0 flex-1 gap-4">
        <ElCard
          class="h-full w-64 shrink-0"
          :body-style="{ height: '100%', overflow: 'auto' }"
        >
          <ElInput
            v-model="subjectKeyword"
            clearable
            placeholder="搜索科目"
          />
          <ElTree
            ref="subjectTreeRef"
            class="mt-3"
            :data="subjects"
            :filter-node-method="filterSubject"
            highlight-current
            node-key="id"
            :props="{ label: getSubjectLabel, children: 'children' }"
            @node-click="handleSubjectClick"
          />
        </ElCard>
        <div class="min-w-0 flex-1">
          <Grid id="fms-detail-ledger-table">
            <template #voucherNumber="{ row }">
              <ElButton
                v-if="row.voucherId"
                v-access:code="['fms:voucher:query']"
                link
                type="primary"
                class="!p-0"
                @click="openVoucher(row)"
              >
                {{ row.voucherNumber }}
              </ElButton>
            </template>
          </Grid>
        </div>
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
