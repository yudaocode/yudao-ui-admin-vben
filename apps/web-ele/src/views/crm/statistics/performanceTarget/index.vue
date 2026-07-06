<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmStatisticsPerformanceTargetApi } from '#/api/crm/statistics/performanceTarget';

import { onMounted, ref } from 'vue';

import { ContentWrap, Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { useUserStore } from '@vben/stores';
import { erpPriceInputFormatter, handleTree } from '@vben/utils';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { BizTypeEnum } from '#/api/crm/permission';
import { getPerformanceTargetSummary } from '#/api/crm/statistics/performanceTarget';
import { getSimpleDeptList } from '#/api/system/dept';
import { getSimpleUserList } from '#/api/system/user';
import { $t } from '#/locales';

const userStore = useUserStore();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const bizTypeOptions = [
  { label: '销售目标', value: BizTypeEnum.CRM_CONTRACT },
  { label: '回款目标', value: BizTypeEnum.CRM_RECEIVABLE },
];

/** 搜索表单 */
function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      fieldName: 'year',
      label: '选择年份',
      component: 'DatePicker',
      componentProps: {
        type: 'year',
        format: 'YYYY',
        valueFormat: 'YYYY',
        placeholder: '请选择年份',
      },
      defaultValue: new Date().getFullYear().toString(),
    },
    {
      fieldName: 'bizType',
      label: '目标类型',
      component: 'Select',
      componentProps: {
        options: bizTypeOptions,
        placeholder: '请选择目标类型',
      },
      defaultValue: BizTypeEnum.CRM_CONTRACT,
    },
    {
      fieldName: 'deptId',
      label: '归属部门',
      component: 'ApiTreeSelect',
      componentProps: {
        api: async () => handleTree(await getSimpleDeptList()),
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        defaultExpandAll: true,
        placeholder: '请选择归属部门',
      },
      defaultValue: userStore.userInfo?.deptId,
    },
    {
      fieldName: 'userId',
      label: '员工',
      component: 'ApiSelect',
      componentProps: {
        api: getSimpleUserList,
        allowClear: true,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: '请选择员工',
      },
    },
  ];
}

const [QueryForm, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: useGridFormSchema(),
  showCollapseButton: true,
  submitButtonOptions: {
    content: $t('common.query'),
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
  handleSubmit: async () => {
    await loadData();
  },
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'monthName', title: '月份', minWidth: 120 },
      {
        field: 'targetPrice',
        title: '目标金额（元）',
        formatter: 'formatAmount2',
        minWidth: 160,
        slots: { default: 'targetPrice' },
      },
      {
        field: 'currentPrice',
        title: '完成金额（元）',
        formatter: 'formatAmount2',
        minWidth: 160,
        slots: { default: 'currentPrice' },
      },
      { field: 'completionRateText', title: '完成率', minWidth: 120 },
    ],
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'month',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<
    CrmStatisticsPerformanceTargetApi.PerformanceTargetRespVO
  >,
});

/** 获取接口参数 */
async function getApiParams() {
  const values = await formApi.getValues();
  return {
    ...values,
    year: Number(values.year),
  };
}

/** 格式化月份 */
function formatMonth(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** 构建图表配置 */
function getChartOptions(
  year: number,
  data: CrmStatisticsPerformanceTargetApi.PerformanceTargetRespVO[],
) {
  return {
    grid: {
      left: 20,
      right: 40,
      bottom: 72,
      containLabel: true,
    },
    legend: {
      bottom: 8,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    xAxis: {
      type: 'category',
      name: '月份',
      data: data.map((item) => formatMonth(year, item.month)),
    },
    yAxis: [
      {
        type: 'value',
        name: '金额（元）',
      },
      {
        type: 'value',
        name: '完成率',
        axisLabel: {
          formatter: '{value}%',
        },
      },
    ],
    series: [
      {
        name: '目标金额（元）',
        type: 'bar',
        data: data.map((item) => item.targetPrice),
      },
      {
        name: '完成金额（元）',
        type: 'bar',
        data: data.map((item) => item.currentPrice),
      },
      {
        name: '完成率（%）',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((item) => item.completionRate),
      },
    ],
    toolbox: {
      feature: {
        dataZoom: {
          xAxisIndex: false,
        },
        brush: {
          type: ['lineX', 'clear'],
        },
        saveAsImage: { show: true, name: '业绩达成' },
      },
    },
  };
}

/** 统计合计行 */
function buildSummaryRow(
  data: CrmStatisticsPerformanceTargetApi.PerformanceTargetRespVO[],
) {
  const targetTotal = data.reduce(
    (sum, item) => sum + Number(item.targetPrice || 0),
    0,
  );
  const currentTotal = data.reduce(
    (sum, item) => sum + Number(item.currentPrice || 0),
    0,
  );
  const completionRate =
    targetTotal > 0 ? ((currentTotal / targetTotal) * 100).toFixed(2) : '0.00';
  return {
    month: 13,
    monthName: '合计',
    targetPrice: targetTotal,
    currentPrice: currentTotal,
    completionRateText: `${completionRate}%`,
  };
}

/** 获取业绩目标完成情况 */
async function loadData() {
  const params = await getApiParams();
  const data = await getPerformanceTargetSummary(params);
  const tableData = data.map((item) => ({
    ...item,
    monthName: formatMonth(params.year, item.month),
    completionRateText: `${item.completionRate || 0}%`,
  }));
  await renderEcharts(getChartOptions(params.year, data), true);
  await gridApi.grid.reloadData([...tableData, buildSummaryRow(data)]);
}

/** 初始化 */
onMounted(() => {
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <ContentWrap>
      <QueryForm />
      <EchartsUI class="mb-5 h-[500px] w-full" ref="chartRef" />
      <Grid>
        <template #targetPrice="{ row }">
          {{ erpPriceInputFormatter(row.targetPrice) }}
        </template>
        <template #currentPrice="{ row }">
          {{ erpPriceInputFormatter(row.currentPrice) }}
        </template>
      </Grid>
    </ContentWrap>
  </Page>
</template>
