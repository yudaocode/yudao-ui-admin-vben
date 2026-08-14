<script lang="ts" setup>
import type { FmsInitialBalanceViewRow } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAuxiliaryItemApi } from '#/api/fms/config/auxiliary/item';
import type { FmsInitialBalanceApi } from '#/api/fms/config/initial-balance';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Alert, Button, message, Select } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAccountSet } from '#/api/fms/config/account-set';
import {
  exportInitialBalance,
  getInitialBalanceList,
  saveInitialBalance,
} from '#/api/fms/config/initial-balance';
import { useFmsStore } from '#/views/fms/store/fms';
import {
  FMS_DEBIT_CREDIT_DIRECTION,
  FMS_SUBJECT_TYPE,
} from '#/views/fms/utils/constants';

import { formatAmount, formatQuantity } from '#/views/fms/utils/format';

import AmountInput from './components/amount-input.vue';
import { AMOUNT_FIELDS, DIRECT_SUM_FIELDS, useGridColumns } from './data';
import AssistForm from './modules/assist-form.vue';
import ImportForm from './modules/import-form.vue';
import TrialBalanceDialog from './modules/trial-balance-dialog.vue';

defineOptions({ name: 'FmsInitialBalance' });
const subjectTypeOptions = getDictOptions(DICT_TYPE.FMS_SUBJECT_TYPE, 'number');

// ==================== 页面状态 ====================

const fmsStore = useFmsStore(); // FMS 状态
const saving = ref(false); // 保存的提交中
const exportLoading = ref(false); // 导出的加载中
const edited = ref(false); // 是否存在未保存修改
const subjectType = ref<number>(FMS_SUBJECT_TYPE.ASSET); // 当前科目类别
const tableData = ref<FmsInitialBalanceViewRow[]>([]); // 列表的数据
const accountStartTime = ref<number>(); // 账套启用时间
const currentMonth = ref<string>(); // 当前会计期间
const assistSubject = ref<FmsInitialBalanceViewRow>(); // 正在添加辅助核算明细的科目
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const isJanuary = computed(
  () =>
    !!accountStartTime.value &&
    new Date(accountStartTime.value).getMonth() === 0,
); // 账套是否从一月启用
const editable = computed(
  () =>
    !!accountStartTime.value &&
    !!currentMonth.value &&
    currentMonth.value === dayjs(accountStartTime.value).format('YYYY-MM'),
); // 是否可编辑，结账后初始余额不可修改
const showProfitLoss = computed(
  () => subjectType.value === FMS_SUBJECT_TYPE.PROFIT_LOSS,
); // 是否展示实际损益发生额

const [AssistFormModal, assistFormModalApi] = useVbenModal({
  connectedComponent: AssistForm,
  destroyOnClose: true,
});
const [ImportFormModal, importFormModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});
const [TrialBalanceModal, trialBalanceModalApi] = useVbenModal({
  connectedComponent: TrialBalanceDialog,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useGridColumns({ isJanuary: false, showProfitLoss: false }),
    height: 'auto',
    pagerConfig: { enabled: false },
    rowConfig: {
      keyField: 'rowKey',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<FmsInitialBalanceViewRow>,
});

watch(accountSetId, () => loadPage());

/** 账套启用期间、科目类别变化时重建表格列 */
watch([isJanuary, showProfitLoss], () => {
  gridApi.setGridOptions({
    columns: useGridColumns({
      isJanuary: isJanuary.value,
      showProfitLoss: showProfitLoss.value,
    }),
  });
});

// ==================== 页面加载 ====================

/** 加载账套信息、初始余额列表和当前会计期间 */
async function loadPage() {
  if (!accountSetId.value) {
    tableData.value = [];
    gridApi.setGridOptions({ data: [] });
    return;
  }
  gridApi.setLoading(true);
  try {
    const [accountSet, balances, month] = await Promise.all([
      getAccountSet(accountSetId.value),
      getInitialBalanceList(accountSetId.value, subjectType.value),
      fmsStore.loadCurrentMonth(),
    ]);
    accountStartTime.value = accountSet.startTime;
    currentMonth.value = month;
    tableData.value = buildViewRows(balances);
    gridApi.setGridOptions({ data: tableData.value });
    edited.value = false;
  } finally {
    gridApi.setLoading(false);
  }
}

/** 切换科目类别 */
async function changeSubjectType(value: unknown) {
  const type = Number(value);
  if (edited.value) {
    try {
      await confirm('当前修改尚未保存，确定放弃修改并切换科目类别吗？');
    } catch {
      return;
    }
  }
  if (isJanuary.value && type === FMS_SUBJECT_TYPE.PROFIT_LOSS) {
    message.warning('年初启用的账套不需要录入损益初始余额');
    return;
  }
  subjectType.value = type;
  await loadPage();
}

/** 打开导入弹窗 */
function openImportForm() {
  if (!accountSetId.value) return;
  importFormModalApi.setData({ accountSetId: accountSetId.value }).open();
}

/** 打开试算平衡 */
function openTrialBalance() {
  if (!accountSetId.value) return;
  trialBalanceModalApi.setData({ accountSetId: accountSetId.value }).open();
}

/** 导出初始余额 */
async function handleExport() {
  if (!accountSetId.value || exportLoading.value) return;
  exportLoading.value = true;
  try {
    const data = await exportInitialBalance(accountSetId.value);
    downloadFileFromBlobPart({ fileName: '财务初始余额.xlsx', source: data });
  } finally {
    exportLoading.value = false;
  }
}

/** 构建平铺行：父级科目在前，辅助明细紧跟所属科目 */
function buildViewRows(
  list: FmsInitialBalanceApi.InitialBalance[],
): FmsInitialBalanceViewRow[] {
  const rows: FmsInitialBalanceViewRow[] = [];
  const levelMap = new Map<number, number>();
  const parentIds = new Set(list.map((item) => item.parentId));
  list.forEach((item) => {
    const level = (item.parentId ? levelMap.get(item.parentId) || 0 : 0) + 1;
    levelMap.set(item.subjectId, level);
    const subjectRow: FmsInitialBalanceViewRow = {
      ...item,
      rowKey: `subject-${item.subjectId}`,
      isLeaf: !parentIds.has(item.subjectId),
      level,
    };
    rows.push(subjectRow);
    item.assistBalances.forEach((assist, index) => {
      rows.push(buildAssistViewRow(subjectRow, assist, index));
    });
  });
  return rows;
}

// ==================== 辅助核算余额 ====================

/** 构建辅助核算明细行 */
function buildAssistViewRow(
  subject: FmsInitialBalanceViewRow,
  assist: FmsInitialBalanceApi.AssistBalance,
  index: number,
): FmsInitialBalanceViewRow {
  return {
    ...subject,
    ...assist,
    rowKey: `assist-${subject.subjectId}-${assist.assistCombinationId || index}`,
    isAssist: true,
    level: subject.level + 1,
    auxiliaryItemIds: assist.auxiliaries.map((item) => item.itemId),
    assistBalances: [],
  };
}

/** 判断是否可编辑：辅助明细行，或未启用辅助核算的末级科目行 */
function canEdit(row: FmsInitialBalanceViewRow) {
  return (
    fmsStore.isAccountSetWritable &&
    editable.value &&
    (row.isAssist || (row.isLeaf && !row.auxiliaryAccounting))
  );
}

/** 判断是否可添加明细：启用辅助核算的末级科目行 */
function canAddAssist(row: FmsInitialBalanceViewRow) {
  return (
    fmsStore.isAccountSetWritable &&
    editable.value &&
    !row.isAssist &&
    row.isLeaf &&
    row.auxiliaryAccounting
  );
}

/** 获得行名称，辅助明细行拼接“科目名称_项目名称” */
function getRowName(row: FmsInitialBalanceViewRow) {
  if (!row.isAssist) return row.subjectName;
  return `${row.subjectName}_${row.auxiliaries?.map((item) => item.name).join('_')}`;
}

/** 打开添加明细弹窗 */
function openAssistForm(row: FmsInitialBalanceViewRow) {
  if (!accountSetId.value) return;
  assistSubject.value = row;
  assistFormModalApi.setData(row).open();
}

/** 添加辅助核算明细行 */
function addAssist(combinations: FmsAuxiliaryItemApi.AuxiliaryItemOption[][]) {
  const subject = assistSubject.value;
  if (!subject) return;
  // 插入到所属科目的最后一条辅助明细之后
  let insertIndex =
    tableData.value.findIndex((row) => row.rowKey === subject.rowKey) + 1;
  while (
    insertIndex < tableData.value.length &&
    tableData.value[insertIndex]!.isAssist &&
    tableData.value[insertIndex]!.subjectId === subject.subjectId
  ) {
    insertIndex++;
  }
  const newRows = combinations
    .filter(
      (items) =>
        !tableData.value.some(
          (row) =>
            row.isAssist &&
            row.subjectId === subject.subjectId &&
            row.auxiliaryItemIds?.length === items.length &&
            items.every((item) => row.auxiliaryItemIds?.includes(item.id)),
        ),
    )
    .map((items, index) =>
      buildAssistViewRow(
        subject,
        {
          ...zeroAmounts(),
          auxiliaries: subject.auxiliaryConfigs.map((config, configIndex) => {
            const item = items[configIndex]!;
            return {
              type: config.type,
              typeId: config.auxiliaryTypeId,
              itemId: item.id,
              name: item.name,
            };
          }),
        },
        Date.now() + index,
      ),
    );
  if (newRows.length === 0) {
    message.warning('所选辅助核算明细均已存在');
    return;
  }
  tableData.value.splice(insertIndex, 0, ...newRows);
  gridApi.setGridOptions({ data: tableData.value });
  edited.value = true;
  aggregateRows();
}

/** 删除辅助核算明细行 */
function removeAssist(row: FmsInitialBalanceViewRow) {
  tableData.value = tableData.value.filter(
    (item) => item.rowKey !== row.rowKey,
  );
  gridApi.setGridOptions({ data: tableData.value });
  edited.value = true;
  aggregateRows();
}

/** 金额变化时按余额方向重算年初余额，并汇总父级 */
function handleAmountChange(row: FmsInitialBalanceViewRow) {
  if (!isJanuary.value) {
    if (row.balanceDirection === FMS_DEBIT_CREDIT_DIRECTION.DEBIT) {
      row.yearOpeningAmount =
        row.openingAmount - row.yearDebitAmount + row.yearCreditAmount;
      row.yearOpeningQuantity =
        row.openingQuantity - row.yearDebitQuantity + row.yearCreditQuantity;
    } else {
      row.yearOpeningAmount =
        row.openingAmount + row.yearDebitAmount - row.yearCreditAmount;
      row.yearOpeningQuantity =
        row.openingQuantity + row.yearDebitQuantity - row.yearCreditQuantity;
    }
  }
  edited.value = true;
  aggregateRows();
}

/** 实际损益发生额变化时标记未保存并汇总父级 */
function handleProfitLossAmountChange() {
  edited.value = true;
  aggregateRows();
}

// ==================== 汇总与保存 ====================

/** 汇总父级科目余额：辅助明细计入所属科目，子科目计入父科目 */
function aggregateRows() {
  const rows = tableData.value;
  const subjectMap = new Map<number, FmsInitialBalanceViewRow>();
  // 1. 非末级科目和启用辅助核算的科目由明细汇总，先清零
  rows.forEach((row) => {
    if (row.isAssist) return;
    subjectMap.set(row.subjectId, row);
    if (!row.isLeaf || row.auxiliaryAccounting) {
      AMOUNT_FIELDS.forEach((field) => (row[field] = 0));
    }
  });
  // 2. 平铺列表父级在前，倒序遍历时子级先完成汇总，再逐级累加到父级
  for (let index = rows.length - 1; index >= 0; index--) {
    const row = rows[index]!;
    const parent = row.isAssist
      ? subjectMap.get(row.subjectId)
      : subjectMap.get(row.parentId!);
    if (!parent) continue;
    AMOUNT_FIELDS.forEach((field) => {
      const amount = Number(row[field] || 0);
      parent[field] =
        Number(parent[field] || 0) +
        (DIRECT_SUM_FIELDS.has(field) ||
        row.balanceDirection === parent.balanceDirection
          ? amount
          : -amount);
    });
  }
}

/** 保存初始余额 */
async function handleSave() {
  if (!accountSetId.value || !editable.value) return;
  const assistRows = tableData.value.filter((row) => row.isAssist);
  const balances: FmsInitialBalanceApi.UpdateReq[] = tableData.value
    .filter((row) => !row.isAssist && row.isLeaf)
    .map((row) => ({
      subjectId: row.subjectId,
      ...pickAmounts(row),
      assistBalances: assistRows
        .filter((item) => item.subjectId === row.subjectId)
        .map((item) => ({
          auxiliaryItemIds: item.auxiliaryItemIds || [],
          ...pickAmounts(item),
        })),
    }));
  if (
    subjectType.value === FMS_SUBJECT_TYPE.PROFIT_LOSS &&
    balances.some((item) => Math.abs(item.yearOpeningAmount) >= 0.005)
  ) {
    message.warning('损益类科目的年初余额必须为 0');
    return;
  }
  saving.value = true;
  try {
    await saveInitialBalance(accountSetId.value, balances);
    message.success('保存成功');
    await loadPage();
  } finally {
    saving.value = false;
  }
}

/** 提取行的金额和数量字段 */
function pickAmounts(
  row: FmsInitialBalanceViewRow,
): FmsInitialBalanceApi.Amounts {
  return {
    openingAmount: Number(row.openingAmount || 0),
    openingQuantity: Number(row.openingQuantity || 0),
    yearDebitAmount: Number(row.yearDebitAmount || 0),
    yearDebitQuantity: Number(row.yearDebitQuantity || 0),
    yearCreditAmount: Number(row.yearCreditAmount || 0),
    yearCreditQuantity: Number(row.yearCreditQuantity || 0),
    yearOpeningAmount: Number(row.yearOpeningAmount || 0),
    yearOpeningQuantity: Number(row.yearOpeningQuantity || 0),
    profitLossAmount: Number(row.profitLossAmount || 0),
    profitLossQuantity: Number(row.profitLossQuantity || 0),
  };
}

/** 构建全零的金额和数量字段 */
function zeroAmounts(): FmsInitialBalanceApi.Amounts {
  return {
    openingAmount: 0,
    openingQuantity: 0,
    yearDebitAmount: 0,
    yearDebitQuantity: 0,
    yearCreditAmount: 0,
    yearCreditQuantity: 0,
    yearOpeningAmount: 0,
    yearOpeningQuantity: 0,
    profitLossAmount: 0,
    profitLossQuantity: 0,
  };
}

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
  loadPage();
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

onBeforeRouteLeave(async () => {
  if (!edited.value) return true;
  try {
    await confirm('当前修改尚未保存，确定放弃修改并离开页面吗？');
    edited.value = false;
    return true;
  } catch {
    return false;
  }
});

/** 浏览器刷新或关闭前提示未保存修改 */
function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!edited.value) return;
  event.preventDefault();
  event.returnValue = '';
}
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <template #doc>
      <DocAlert
        title="【设置】币别、科目、辅助核算、初始余额"
        url="https://doc.iocoder.cn/fms/config/accounting/"
      />
    </template>
    <AssistFormModal @success="addAssist" />
    <ImportFormModal @success="loadPage" />
    <TrialBalanceModal />

    <!-- 科目类别和操作按钮 -->
    <div class="mb-4 flex shrink-0 items-center gap-2">
      <span class="shrink-0 text-sm">科目类别</span>
      <Select
        :options="subjectTypeOptions"
        :value="subjectType"
        class="w-60"
        @change="changeSubjectType"
      />
      <Button
        v-if="editable && fmsStore.isAccountSetWritable"
        v-access:code="['fms:config:initial-balance:update']"
        :loading="saving"
        type="primary"
        @click="handleSave"
      >
        保存
      </Button>
      <Button
        v-access:code="['fms:config:initial-balance:query']"
        @click="openTrialBalance"
      >
        试算平衡
      </Button>
      <Button
        v-if="editable && fmsStore.isAccountSetWritable"
        v-access:code="['fms:config:initial-balance:import']"
        @click="openImportForm"
      >
        <template #icon>
          <IconifyIcon icon="lucide:upload" />
        </template>
        导入
      </Button>
      <Button
        v-access:code="['fms:config:initial-balance:export']"
        :loading="exportLoading"
        @click="handleExport"
      >
        <template #icon>
          <IconifyIcon icon="lucide:download" />
        </template>
        导出
      </Button>
    </div>

    <!-- 提示信息 -->
    <Alert
      v-if="isJanuary"
      class="mb-4 shrink-0"
      :closable="false"
      show-icon
      message="账套从一月启用，只需录入期初余额"
      type="info"
    />
    <Alert
      v-if="accountStartTime && !editable"
      class="mb-4 shrink-0"
      :closable="false"
      show-icon
      message="账套已结账，初始余额不可修改"
      type="warning"
    />
    <Alert
      v-if="edited"
      class="mb-4 shrink-0"
      :closable="false"
      show-icon
      message="当前修改尚未保存，切换科目类别或离开页面前请先保存"
      type="warning"
    />

    <!-- 初始余额表格 -->
    <Grid class="min-h-0 flex-1">
      <template #subjectCode="{ row }">
        <span :class="{ 'text-muted-foreground': row.isAssist }">
          {{ row.subjectCode }}
        </span>
      </template>
      <template #subjectName="{ row }">
        <span
          :class="{ 'text-muted-foreground': row.isAssist }"
          :style="{ paddingLeft: `${(row.level - 1) * 14}px` }"
        >
          {{ getRowName(row) }}
        </span>
        <Button
          v-if="canAddAssist(row)"
          class="ml-2"
          size="small"
          type="link"
          @click="openAssistForm(row)"
        >
          <template #icon>
            <IconifyIcon icon="lucide:plus" />
          </template>
          添加明细
        </Button>
        <Button
          v-if="row.isAssist && editable && fmsStore.isAccountSetWritable"
          class="ml-2"
          danger
          size="small"
          type="link"
          @click="removeAssist(row)"
        >
          删除
        </Button>
      </template>
      <template #balanceDirection="{ row }">
        {{
          row.balanceDirection === FMS_DEBIT_CREDIT_DIRECTION.DEBIT
            ? '借'
            : '贷'
        }}
      </template>

      <template #openingQuantity="{ row }">
        <AmountInput
          v-if="canEdit(row) && row.quantityAccounting"
          v-model="row.openingQuantity"
          :precision="4"
          @change="handleAmountChange(row)"
        />
        <span v-else>
          {{ formatQuantity(row.openingQuantity, row.quantityAccounting) }}
        </span>
      </template>
      <template #openingAmount="{ row }">
        <AmountInput
          v-if="canEdit(row)"
          v-model="row.openingAmount"
          @change="handleAmountChange(row)"
        />
        <span v-else>{{ formatAmount(row.openingAmount) }}</span>
      </template>

      <template #yearDebitQuantity="{ row }">
        <AmountInput
          v-if="canEdit(row) && row.quantityAccounting"
          v-model="row.yearDebitQuantity"
          :precision="4"
          @change="handleAmountChange(row)"
        />
        <span v-else>
          {{ formatQuantity(row.yearDebitQuantity, row.quantityAccounting) }}
        </span>
      </template>
      <template #yearDebitAmount="{ row }">
        <AmountInput
          v-if="canEdit(row)"
          v-model="row.yearDebitAmount"
          @change="handleAmountChange(row)"
        />
        <span v-else>{{ formatAmount(row.yearDebitAmount) }}</span>
      </template>

      <template #yearCreditQuantity="{ row }">
        <AmountInput
          v-if="canEdit(row) && row.quantityAccounting"
          v-model="row.yearCreditQuantity"
          :precision="4"
          @change="handleAmountChange(row)"
        />
        <span v-else>
          {{ formatQuantity(row.yearCreditQuantity, row.quantityAccounting) }}
        </span>
      </template>
      <template #yearCreditAmount="{ row }">
        <AmountInput
          v-if="canEdit(row)"
          v-model="row.yearCreditAmount"
          @change="handleAmountChange(row)"
        />
        <span v-else>{{ formatAmount(row.yearCreditAmount) }}</span>
      </template>

      <template #yearOpeningQuantity="{ row }">
        <span>
          {{ formatQuantity(row.yearOpeningQuantity, row.quantityAccounting) }}
        </span>
      </template>
      <template #yearOpeningAmount="{ row }">
        <span>{{ formatAmount(row.yearOpeningAmount) }}</span>
      </template>

      <template #profitLossQuantity="{ row }">
        <AmountInput
          v-if="canEdit(row) && row.quantityAccounting"
          v-model="row.profitLossQuantity"
          :precision="4"
          @change="handleProfitLossAmountChange"
        />
        <span v-else>
          {{ formatQuantity(row.profitLossQuantity, row.quantityAccounting) }}
        </span>
      </template>
      <template #profitLossAmount="{ row }">
        <AmountInput
          v-if="canEdit(row)"
          v-model="row.profitLossAmount"
          @change="handleProfitLossAmountChange"
        />
        <span v-else>{{ formatAmount(row.profitLossAmount) }}</span>
      </template>
    </Grid>
  </Page>
</template>
