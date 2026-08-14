<script lang="ts" setup>
import type { FmsCashFlowStatementRow } from './data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsReportApi } from '#/api/fms/report';
import type { FmsCashFlowStatementApi } from '#/api/fms/report/cash-flow-statement';

import { computed, reactive, ref, watch } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElAlert,
  ElButton,
  ElInputNumber,
  ElMessage,
  ElTooltip,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkCashFlowStatement,
  exportCashFlowStatement,
  getCashFlowAdjustmentList,
  getCashFlowStatement,
  updateCashFlowAdjustment,
  updateCashFlowStatement,
} from '#/api/fms/report/cash-flow-statement';
import FmsReportCheckAlert from '#/views/fms/report/components/fms-report-check-alert.vue';
import FmsReportFormulaForm from '#/views/fms/report/components/fms-report-formula-form.vue';
import FmsReportPeriodBar from '#/views/fms/report/components/fms-report-period-bar.vue';
import FmsReportPrintButton from '#/views/fms/report/components/fms-report-print-button.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_REPORT_TYPE } from '#/views/fms/utils/constants';
import { formatMoney } from '#/views/fms/utils/format';

import { useGridColumns } from './data';

defineOptions({ name: 'FmsCashFlowStatement' });

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const loading = ref(false); // 列表的加载中
const exportLoading = ref(false); // 导出的加载中
const submitting = ref(false); // 辅助数据保存的提交中
const adjustmentMode = ref(false); // 是否为辅助数据调整模式
const statementAdjustmentMode = ref(false); // 是否为现金流量表人工调整模式
const list = ref<FmsReportApi.ReportItem[]>([]); // 现金流量表的项目列表
const checkResult = ref<FmsCashFlowStatementApi.CashFlowCheck>(); // 检查结果
const adjustmentList = ref<FmsCashFlowStatementApi.CashFlowAdjustment[]>([]); // 现金流量辅助数据列表
const periodLabel = ref(''); // 会计期间文本，用于打印和导出文件名
const formulaFormRef = ref<InstanceType<typeof FmsReportFormulaForm>>(); // 公式编辑弹窗
const queryParams = reactive<FmsReportApi.ListReq>({
  accountSetId: 0,
  startMonth: '',
  endMonth: '',
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useGridColumns(false),
    height: 'auto',
    pagerConfig: { enabled: false },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<FmsCashFlowStatementRow>,
});

watch(accountSetId, () => {
  adjustmentMode.value = false;
  statementAdjustmentMode.value = false;
  getList();
});

/** 调整模式变化时重建金额列标题 */
watch(adjustmentMode, (value) => {
  gridApi.setGridOptions({ columns: useGridColumns(value) });
});

/** 工具栏查询 */
async function handleQuery(value: {
  endMonth: string;
  label: string;
  startMonth: string;
}) {
  periodLabel.value = value.label;
  Object.assign(queryParams, value, { accountSetId: accountSetId.value });
  await getList();
}

/** 查询列表和检查结果 */
async function getList() {
  if (!accountSetId.value || !queryParams.endMonth) {
    list.value = [];
    gridApi.setGridOptions({ data: [] });
    checkResult.value = undefined;
    return;
  }
  setLoading(true);
  try {
    queryParams.accountSetId = accountSetId.value;
    list.value = await getCashFlowStatement(queryParams);
    gridApi.setGridOptions({ data: list.value });
    checkResult.value = await checkCashFlowStatement(queryParams);
  } finally {
    setLoading(false);
  }
}

/** 同步页面和表格的加载状态 */
function setLoading(value: boolean) {
  loading.value = value;
  gridApi.setLoading(value);
}

/** 导出 Excel */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportCashFlowStatement(queryParams);
    downloadFileFromBlobPart({
      fileName: `现金流量表-${periodLabel.value}.xls`,
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 进入辅助数据调整模式 */
async function openAdjustment() {
  statementAdjustmentMode.value = false;
  adjustmentMode.value = true;
  await getAdjustmentList();
}

/** 保存现金流量表 */
async function saveStatementAdjustment() {
  const items = list.value
    .filter(isAmountAdjustable)
    .map(({ id, currentAmount, yearAmount }) => ({
      id,
      currentAmount: Number(currentAmount || 0),
      yearAmount: Number(yearAmount || 0),
    }));
  if (!accountSetId.value || !items.length) return;
  submitting.value = true;
  try {
    await updateCashFlowStatement({ ...queryParams, items });
    ElMessage.success('保存成功');
    statementAdjustmentMode.value = false;
    await getList();
  } finally {
    submitting.value = false;
  }
}

/** 清空现金流量表金额，保存后重新按公式计算 */
function clearStatementAdjustment() {
  list.value.filter(isAmountAdjustable).forEach((item) => {
    item.currentAmount = 0;
    item.yearAmount = 0;
  });
}

/** 查询辅助数据列表 */
async function getAdjustmentList() {
  if (!accountSetId.value || !queryParams.endMonth) return;
  setLoading(true);
  try {
    queryParams.accountSetId = accountSetId.value;
    adjustmentList.value = await getCashFlowAdjustmentList(queryParams);
    gridApi.setGridOptions({ data: adjustmentList.value });
  } finally {
    setLoading(false);
  }
}

/** 保存辅助数据 */
async function saveAdjustment(next = false) {
  const items = adjustmentList.value
    .filter((item) => item.editable)
    .map((item) => ({
      id: item.id,
      currentAmount: Number(item.currentAmount || 0),
      yearAmount: Number(item.yearAmount || 0),
    }));
  if (!accountSetId.value || !items.length) return;
  submitting.value = true;
  try {
    await updateCashFlowAdjustment({
      accountSetId: accountSetId.value,
      items,
    });
    ElMessage.success('保存成功');
    adjustmentMode.value = false;
    statementAdjustmentMode.value = next;
    await getList();
  } finally {
    submitting.value = false;
  }
}

/** 清空辅助数据金额，保存后重新按科目公式计算 */
function clearAdjustment() {
  adjustmentList.value
    .filter((item) => item.editable)
    .forEach((item) => {
      item.currentAmount = 0;
      item.yearAmount = 0;
    });
  recalculateAdjustmentLineItems();
}

/** 根据当前辅助数据即时重算行次公式项目 */
function recalculateAdjustmentLineItems() {
  const lineMap = new Map(adjustmentList.value.map((item) => [item.rowNo, item]));
  adjustmentList.value.forEach((item) => {
    if (!item.formula?.includes('L')) return;
    item.currentAmount = calculateAdjustmentLineAmount(
      item.formula,
      lineMap,
      'currentAmount',
    );
    item.yearAmount = calculateAdjustmentLineAmount(
      item.formula,
      lineMap,
      'yearAmount',
    );
    lineMap.set(item.rowNo, item);
  });
}

/** 按后端相同的 +/- L行次 语义计算辅助数据金额 */
function calculateAdjustmentLineAmount(
  formula: string,
  lineMap: Map<number, FmsCashFlowStatementApi.CashFlowAdjustment>,
  amountField: 'currentAmount' | 'yearAmount',
) {
  let expressions: unknown;
  try {
    expressions = JSON.parse(formula);
  } catch {
    return 0;
  }
  if (!Array.isArray(expressions) || typeof expressions[0] !== 'string')
    return 0;
  let amount = 0;
  for (const match of expressions[0].matchAll(/([+-]?)(L\d+)/g)) {
    const rowAmount = Number(
      lineMap.get(Number(match[2]!.slice(1)))?.[amountField] || 0,
    );
    amount += match[1] === '-' ? -rowAmount : rowAmount;
  }
  return Number(amount.toFixed(2));
}

/** 返回现金流量表 */
async function closeAdjustment() {
  adjustmentMode.value = false;
  adjustmentList.value = [];
  await getList();
}

/** 返回辅助数据调整 */
async function returnToAdjustment() {
  statementAdjustmentMode.value = false;
  adjustmentMode.value = true;
  await getAdjustmentList();
}

/** 是否允许直接修改现金流量表金额 */
function isAmountAdjustable(item: FmsReportApi.ReportItem) {
  return Boolean(item.rowNo && !item.formula?.includes('L'));
}

/** 获得辅助数据行的说明 */
function getRowRemark(item: FmsCashFlowStatementRow) {
  return 'remark' in item ? item.remark || '' : '';
}

/** 打开公式编辑弹窗 */
function openFormula(item: FmsCashFlowStatementApi.CashFlowAdjustment) {
  formulaFormRef.value?.open(item, 'cash-flow');
}

/** 项目名称样式：按层级缩进，汇总项加粗；悬停行显示公式编辑按钮 */
function itemClass(item: FmsCashFlowStatementRow) {
  return [
    'flex min-h-8 items-center',
    {
      'pl-5': item.level === 2,
      'pl-10': item.level === 3,
      'font-semibold': !item.editable,
    },
  ];
}
</script>

<template>
  <Page auto-content-height content-class="flex flex-col overflow-hidden">
    <template #doc>
      <DocAlert
        title="【报表】财务报表"
        url="https://doc.iocoder.cn/fms/report/"
      />
    </template>
    <!-- 工具栏 -->
    <div class="mb-4 shrink-0">
      <div
        v-if="statementAdjustmentMode || adjustmentMode"
        class="flex flex-wrap items-center gap-2"
      >
        <ElButton
          v-if="adjustmentMode && fmsStore.isAccountSetWritable"
          v-access:code="['fms:report:cash-flow-statement:update']"
          :loading="submitting"
          type="primary"
          @click="saveAdjustment(true)"
        >
          下一步
        </ElButton>
        <ElButton
          v-if="adjustmentMode && fmsStore.isAccountSetWritable"
          v-access:code="['fms:report:cash-flow-statement:update']"
          :disabled="submitting"
          @click="clearAdjustment"
        >
          清空并重算
        </ElButton>
        <ElButton
          v-if="adjustmentMode"
          :disabled="submitting"
          @click="closeAdjustment"
        >
          返回
        </ElButton>
        <ElButton
          v-if="statementAdjustmentMode && fmsStore.isAccountSetWritable"
          v-access:code="['fms:report:cash-flow-statement:update']"
          :loading="submitting"
          type="primary"
          @click="saveStatementAdjustment"
        >
          保存
        </ElButton>
        <ElButton
          v-if="statementAdjustmentMode && fmsStore.isAccountSetWritable"
          :disabled="submitting"
          @click="returnToAdjustment"
        >
          上一步
        </ElButton>
        <ElButton
          v-if="statementAdjustmentMode && fmsStore.isAccountSetWritable"
          v-access:code="['fms:report:cash-flow-statement:update']"
          :disabled="submitting"
          @click="clearStatementAdjustment"
        >
          清空并重算
        </ElButton>
        <FmsReportPrintButton
          v-access:code="['fms:report:cash-flow-statement:print']"
          :disabled="!queryParams.endMonth || loading"
          :period-label="periodLabel"
          target="fms-cash-flow-statement-table"
          title="现金流量表"
        />
        <ElButton
          v-access:code="['fms:report:cash-flow-statement:export']"
          :disabled="!queryParams.endMonth"
          :loading="exportLoading"
          @click="handleExport"
        >
          <IconifyIcon class="mr-1" icon="lucide:download" />
          导出
        </ElButton>
      </div>
      <FmsReportPeriodBar v-else @query="handleQuery">
        <FmsReportPrintButton
          v-access:code="['fms:report:cash-flow-statement:print']"
          :disabled="!queryParams.endMonth"
          :period-label="periodLabel"
          target="fms-cash-flow-statement-table"
          title="现金流量表"
        />
        <ElButton
          v-access:code="['fms:report:cash-flow-statement:export']"
          :disabled="!queryParams.endMonth"
          :loading="exportLoading"
          @click="handleExport"
        >
          <IconifyIcon class="mr-1" icon="lucide:download" />
          导出
        </ElButton>
        <ElButton
          v-if="fmsStore.isAccountSetWritable"
          v-access:code="['fms:report:cash-flow-statement:update']"
          type="primary"
          @click="openAdjustment"
        >
          调整
        </ElButton>
      </FmsReportPeriodBar>
    </div>

    <!-- 检查结果和调整提示 -->
    <FmsReportCheckAlert
      v-if="!adjustmentMode && !statementAdjustmentMode"
      :report-type="FMS_REPORT_TYPE.CASH_FLOW_STATEMENT"
      :result="checkResult"
    />
    <ElAlert
      v-if="adjustmentMode"
      class="mb-4 shrink-0"
      :closable="false"
      show-icon
      title="辅助数据用于现金流量表 EX 项取数；可编辑公式或直接调整本期、本年金额"
      type="info"
    />
    <ElAlert
      v-if="statementAdjustmentMode"
      class="mb-4 shrink-0"
      :closable="false"
      show-icon
      title="可直接调整非行次公式项目；金额为 0 时重新按公式计算"
      type="warning"
    />

    <!-- 列表 -->
    <Grid id="fms-cash-flow-statement-table" class="min-h-0 flex-1">
      <template #name="{ row }">
        <div :class="itemClass(row)">
          <span>{{ row.name }}</span>
          <ElTooltip
            v-if="adjustmentMode && getRowRemark(row)"
            :content="getRowRemark(row)"
          >
            <IconifyIcon
              class="text-muted-foreground ml-1.5"
              icon="lucide:circle-help"
            />
          </ElTooltip>
          <ElButton
            v-if="
              adjustmentMode && row.editable && fmsStore.isAccountSetWritable
            "
            v-access:code="['fms:report:cash-flow-statement:update']"
            class="formula-edit-btn ml-2 !h-auto !p-0"
            link
            title="编辑公式"
            type="primary"
            @click="openFormula(row)"
          >
            <IconifyIcon icon="lucide:square-pen" />
          </ElButton>
        </div>
      </template>
      <template #yearAmount="{ row }">
        <ElInputNumber
          v-if="adjustmentMode && row.editable"
          v-model="row.yearAmount"
          class="w-full [&_.el-input__inner]:!text-right"
          :controls="false"
          :precision="2"
          @change="recalculateAdjustmentLineItems"
        />
        <ElInputNumber
          v-else-if="statementAdjustmentMode && isAmountAdjustable(row)"
          v-model="row.yearAmount"
          class="w-full [&_.el-input__inner]:!text-right"
          :controls="false"
          :precision="2"
        />
        <span v-else>{{ formatMoney(row.yearAmount) }}</span>
      </template>
      <template #currentAmount="{ row }">
        <ElInputNumber
          v-if="adjustmentMode && row.editable"
          v-model="row.currentAmount"
          class="w-full [&_.el-input__inner]:!text-right"
          :controls="false"
          :precision="2"
          @change="recalculateAdjustmentLineItems"
        />
        <ElInputNumber
          v-else-if="statementAdjustmentMode && isAmountAdjustable(row)"
          v-model="row.currentAmount"
          class="w-full [&_.el-input__inner]:!text-right"
          :controls="false"
          :precision="2"
        />
        <span v-else>{{ formatMoney(row.currentAmount) }}</span>
      </template>
    </Grid>
    <div
      v-if="adjustmentMode"
      class="text-muted-foreground shrink-0 px-4 pt-3 text-right"
    >
      共 {{ adjustmentList.length }} 条
    </div>

    <!-- 公式编辑弹窗 -->
    <FmsReportFormulaForm ref="formulaFormRef" @success="getAdjustmentList" />
  </Page>
</template>

<style scoped>
:deep(.vxe-body--row) .formula-edit-btn {
  visibility: hidden;
}

:deep(.vxe-body--row.row--hover) .formula-edit-btn {
  visibility: visible;
}
</style>
