<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsReportApi } from '#/api/fms/report';
import type { FmsBalanceSheetApi } from '#/api/fms/report/balance-sheet';

import { computed, reactive, ref, watch } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkBalanceSheet,
  exportBalanceSheet,
  getBalanceSheet,
} from '#/api/fms/report/balance-sheet';
import FmsReportCheckAlert from '#/views/fms/report/components/fms-report-check-alert.vue';
import FmsReportFormulaForm from '#/views/fms/report/components/fms-report-formula-form.vue';
import FmsReportPeriodBar from '#/views/fms/report/components/fms-report-period-bar.vue';
import FmsReportPrintButton from '#/views/fms/report/components/fms-report-print-button.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_REPORT_TYPE } from '#/views/fms/utils/constants';

import { useGridColumns } from './data';

defineOptions({ name: 'FmsBalanceSheet' });

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const exportLoading = ref(false); // 导出的加载中
const checkResult = ref<FmsBalanceSheetApi.BalanceSheetCheck>(); // 检查结果
const periodLabel = ref(''); // 会计期间文本，用于打印和导出文件名
const queryParams = reactive<FmsReportApi.ListReq>({
  accountSetId: 0,
  startMonth: '',
  endMonth: '',
});
const formulaFormRef = ref<InstanceType<typeof FmsReportFormulaForm>>(); // 公式编辑弹窗

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    rowConfig: {
      keyField: 'rowId',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<FmsBalanceSheetApi.BalanceSheetRow>,
});

watch(accountSetId, () => getList());

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
    gridApi.setGridOptions({ data: [] });
    checkResult.value = undefined;
    return;
  }
  gridApi.setLoading(true);
  try {
    queryParams.accountSetId = accountSetId.value;
    const list = await getBalanceSheet(queryParams);
    gridApi.setGridOptions({ data: list });
    checkResult.value = await checkBalanceSheet(queryParams);
  } finally {
    gridApi.setLoading(false);
  }
}

/** 导出 Excel */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportBalanceSheet(queryParams);
    downloadFileFromBlobPart({
      fileName: `资产负债表-${periodLabel.value}.xls`,
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 项目名称样式：按层级缩进，汇总项加粗 */
function itemClass(level?: number, editable?: boolean, rowNo?: number) {
  return [
    {
      'pl-4': level === 2,
      'pl-8': level === 3,
      'font-semibold': !editable && rowNo,
    },
  ];
}

/** 打开公式编辑弹窗 */
function openFormula(row: FmsBalanceSheetApi.BalanceSheetRow, asset: boolean) {
  const item = {
    id: asset ? row.assetId : row.liabilityId,
    name: asset ? row.assetName : row.liabilityName,
    formula: asset ? row.assetFormula : row.liabilityFormula,
  } as FmsReportApi.ReportItem;
  formulaFormRef.value?.open(item, 'balance');
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
      <FmsReportPeriodBar @query="handleQuery">
        <FmsReportPrintButton
          v-access:code="['fms:report:balance-sheet:print']"
          :disabled="!queryParams.endMonth"
          :period-label="periodLabel"
          target="fms-balance-sheet-table"
          title="资产负债表"
        />
        <ElButton
          v-access:code="['fms:report:balance-sheet:export']"
          :disabled="!queryParams.endMonth"
          :loading="exportLoading"
          @click="handleExport"
        >
          <IconifyIcon class="mr-1" icon="lucide:download" />
          导出
        </ElButton>
      </FmsReportPeriodBar>
    </div>

    <!-- 检查结果 -->
    <FmsReportCheckAlert
      :report-type="FMS_REPORT_TYPE.BALANCE_SHEET"
      :result="checkResult"
    />

    <!-- 列表 -->
    <Grid id="fms-balance-sheet-table" class="min-h-0 flex-1">
      <template #assetName="{ row }">
        <div class="flex items-center gap-1">
          <span
            :class="itemClass(row.assetLevel, row.assetEditable, row.assetRowNo)"
          >
            {{ row.assetName }}
          </span>
          <ElButton
            v-if="row.assetEditable && fmsStore.isAccountSetWritable"
            v-access:code="['fms:report:balance-sheet:update']"
            class="!h-auto !p-0"
            link
            title="编辑公式"
            type="primary"
            @click="openFormula(row, true)"
          >
            <IconifyIcon icon="lucide:square-pen" />
          </ElButton>
        </div>
      </template>
      <template #liabilityName="{ row }">
        <div class="flex items-center gap-1">
          <span
            :class="
              itemClass(
                row.liabilityLevel,
                row.liabilityEditable,
                row.liabilityRowNo,
              )
            "
          >
            {{ row.liabilityName }}
          </span>
          <ElButton
            v-if="row.liabilityEditable && fmsStore.isAccountSetWritable"
            v-access:code="['fms:report:balance-sheet:update']"
            class="!h-auto !p-0"
            link
            title="编辑公式"
            type="primary"
            @click="openFormula(row, false)"
          >
            <IconifyIcon icon="lucide:square-pen" />
          </ElButton>
        </div>
      </template>
    </Grid>

    <!-- 公式编辑弹窗 -->
    <FmsReportFormulaForm ref="formulaFormRef" @success="getList" />
  </Page>
</template>
