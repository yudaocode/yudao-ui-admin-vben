<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsSubjectApi } from '#/api/fms/config/subject';
import type { FmsLedgerApi } from '#/api/fms/ledger';

import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { DocAlert, Page } from '@vben/common-ui';
import {
  downloadFileFromBlobPart,
  formatDate,
  handleTree,
  traverseTreeValues,
} from '@vben/utils';

import { Button, Card, Input, Tree } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDetailSubjectList } from '#/api/fms/config/subject';
import { exportLedgerDetail, getLedgerDetailList } from '#/api/fms/ledger';
import FmsLedgerSearchBar from '#/views/fms/ledger/components/ledger-search-bar.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { buildPeriodFilename } from '#/views/fms/utils/format';

import { getLedgerRowClassName, useGridColumns } from './data';

defineOptions({ name: 'FmsDetailLedger' });

/** 科目树节点 */
type SubjectTreeNode = Omit<FmsSubjectApi.Subject, 'children'> & {
  children?: SubjectTreeNode[];
  key: number;
  label: string;
};

const router = useRouter();
const route = useRoute();
const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const subjects = ref<FmsSubjectApi.Subject[]>([]); // 会计科目树
const subjectKeyword = ref(''); // 科目搜索关键字
const selectedSubjectKeys = ref<number[]>([]); // 选中的科目
const expandedSubjectKeys = ref<number[]>([]); // 展开的科目
const displaySubjectTree = computed(() =>
  filterSubjectTree(buildSubjectTreeNodes(subjects.value), subjectKeyword.value),
); // 过滤后的科目树
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
watch(subjectKeyword, (value) => {
  expandedSubjectKeys.value = value
    ? traverseTreeValues(displaySubjectTree.value, (node) => node.id!)
    : [];
});

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
  selectedSubjectKeys.value = queryParams.subjectId
    ? [queryParams.subjectId]
    : [];
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
    selectedSubjectKeys.value = [queryParams.subjectId];
  }
  await gridApi.reload();
}

/** 处理科目树点击 */
function handleSubjectSelect(_keys: any[], info: any) {
  const subject = info.node.dataRef as SubjectTreeNode;
  queryParams.subjectId = subject.id!;
  selectedSubjectKeys.value = [subject.id!];
  gridApi.reload();
}

/** 构建带展示文本的科目树节点 */
function buildSubjectTreeNodes(
  items: FmsSubjectApi.Subject[],
): SubjectTreeNode[] {
  return items.map((item) => ({
    ...item,
    key: item.id!,
    label: `${item.code} ${item.name}`,
    children: item.children?.length
      ? buildSubjectTreeNodes(item.children)
      : undefined,
  }));
}

/** 按编码或名称过滤科目，命中节点保留全部下级 */
function filterSubjectTree(
  nodes: SubjectTreeNode[],
  keyword: string,
): SubjectTreeNode[] {
  if (!keyword) return nodes;
  const lowerKeyword = keyword.toLowerCase();
  const walk = (items: SubjectTreeNode[]): SubjectTreeNode[] =>
    items.flatMap((item) => {
      if (item.label.toLowerCase().includes(lowerKeyword)) return [item];
      const children = item.children ? walk(item.children) : [];
      return children.length > 0 ? [{ ...item, children }] : [];
    });
  return walk(nodes);
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
      <Card class="mb-4 shrink-0">
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
      </Card>

      <!-- 科目树和明细账列表 -->
      <div class="flex min-h-0 flex-1 gap-4">
        <Card
          class="h-full w-64 shrink-0"
          :body-style="{ height: '100%', overflow: 'auto' }"
        >
          <Input
            v-model:value="subjectKeyword"
            allow-clear
            placeholder="搜索科目"
          />
          <Tree
            v-model:expanded-keys="expandedSubjectKeys"
            v-model:selected-keys="selectedSubjectKeys"
            class="mt-3"
            :field-names="{ title: 'label', key: 'id', children: 'children' }"
            :tree-data="displaySubjectTree"
            @select="handleSubjectSelect"
          />
        </Card>
        <div class="min-w-0 flex-1">
          <Grid id="fms-detail-ledger-table">
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
    </div>
  </Page>
</template>

<style scoped>
:deep(.fms-ledger-summary-row) {
  font-weight: 600;
  background-color: hsl(var(--muted));
}
</style>
