<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsReportApi } from '#/api/fms/report';
import type { FmsIncomeStatementApi } from '#/api/fms/report/income-statement';

import { computed, reactive, ref, watch } from 'vue';

import { DocAlert, Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkIncomeStatement,
  exportIncomeStatement,
  getIncomeStatement,
} from '#/api/fms/report/income-statement';
import FmsReportCheckAlert from '#/views/fms/report/components/fms-report-check-alert.vue';
import FmsReportFormulaForm from '#/views/fms/report/components/fms-report-formula-form.vue';
import FmsReportPeriodBar from '#/views/fms/report/components/fms-report-period-bar.vue';
import FmsReportPrintButton from '#/views/fms/report/components/fms-report-print-button.vue';
import { useFmsStore } from '#/views/fms/store/fms';
import { FMS_REPORT_TYPE } from '#/views/fms/utils/constants';

import { useGridColumns } from './data';

defineOptions({ name: 'FmsIncomeStatement' });

const fmsStore = useFmsStore(); // FMS 状态
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号
const exportLoading = ref(false); // 导出的加载中
const list = ref<FmsReportApi.ReportItem[]>([]); // 利润表的项目列表
const checkResult = ref<FmsIncomeStatementApi.IncomeStatementCheck>(); // 检查结果
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
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<FmsReportApi.ReportItem>,
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
    list.value = [];
    gridApi.setGridOptions({ data: [] });
    checkResult.value = undefined;
    return;
  }
  gridApi.setLoading(true);
  try {
    queryParams.accountSetId = accountSetId.value;
    list.value = await getIncomeStatement(queryParams);
    gridApi.setGridOptions({ data: list.value });
    checkResult.value = await checkIncomeStatement(queryParams);
  } finally {
    gridApi.setLoading(false);
  }
}

/** 导出 Excel */
async function handleExport() {
  exportLoading.value = true;
  try {
    const data = await exportIncomeStatement(queryParams);
    downloadFileFromBlobPart({
      fileName: `利润表-${periodLabel.value}.xls`,
      source: data,
    });
  } finally {
    exportLoading.value = false;
  }
}

/** 项目名称样式：按层级缩进，汇总项加粗 */
function itemClass(item: FmsReportApi.ReportItem) {
  return [
    {
      'pl-5': item.level === 2,
      'pl-10': item.level === 3,
      'font-semibold': !item.editable,
    },
  ];
}

/** 打开公式编辑弹窗 */
function openFormula(item: FmsReportApi.ReportItem) {
  formulaFormRef.value?.open(item, 'income');
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
          v-access:code="['fms:report:income-statement:print']"
          :disabled="!queryParams.endMonth"
          :period-label="periodLabel"
          target="fms-income-statement-table"
          title="利润表"
        />
        <Button
          v-access:code="['fms:report:income-statement:export']"
          :disabled="!queryParams.endMonth"
          :loading="exportLoading"
          @click="handleExport"
        >
          <template #icon>
            <IconifyIcon icon="lucide:download" />
          </template>
          导出
        </Button>
      </FmsReportPeriodBar>
    </div>

    <!-- 检查结果 -->
    <FmsReportCheckAlert
      :report-type="FMS_REPORT_TYPE.INCOME_STATEMENT"
      :result="checkResult"
    />

    <!-- 列表 -->
    <Grid id="fms-income-statement-table" class="min-h-0 flex-1">
      <template #name="{ row }">
        <div class="flex items-center gap-1">
          <span :class="itemClass(row)">{{ row.name }}</span>
          <Button
            v-if="row.editable && fmsStore.isAccountSetWritable"
            v-access:code="['fms:report:income-statement:update']"
            class="!h-auto !p-0"
            title="编辑公式"
            type="link"
            @click="openFormula(row)"
          >
            <template #icon>
              <IconifyIcon icon="lucide:square-pen" />
            </template>
          </Button>
        </div>
      </template>
    </Grid>

    <!-- 公式编辑弹窗 -->
    <FmsReportFormulaForm ref="formulaFormRef" @success="getList" />
  </Page>
</template>
