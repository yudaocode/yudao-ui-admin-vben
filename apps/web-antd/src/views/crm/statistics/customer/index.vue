<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmStatisticsCustomerApi } from '#/api/crm/statistics/customer';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Tabs } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCustomerSummaryByDate,
  getCustomerSummaryByUser,
} from '#/api/crm/statistics/customer';

import { useGridFormSchema, useSummaryGridColumns } from './data';

const activeTabName = ref('customerSummary');
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

async function setChartData(res: any) {
  renderEcharts({
    grid: {
      bottom: '5%',
      containLabel: true,
      left: '5%',
      right: '5%',
      top: '5 %',
    },
    legend: {},
    series: [
      {
        name: '新增客户数',
        type: 'bar',
        yAxisIndex: 0,
        data: res.map((item: any) => item.customerCreateCount),
      },
      {
        name: '成交客户数',
        type: 'bar',
        yAxisIndex: 1,
        data: res.map((item: any) => item.customerDealCount),
      },
    ],
    toolbox: {
      feature: {
        dataZoom: {
          xAxisIndex: false, // 数据区域缩放：Y 轴不缩放
        },
        brush: {
          type: ['lineX', 'clear'], // 区域缩放按钮、还原按钮
        },
        saveAsImage: { show: true, name: '客户总量分析' }, // 保存为图片
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
    },
    yAxis: [
      {
        type: 'value',
        name: '新增客户数',
        min: 0,
        minInterval: 1, // 显示整数刻度
      },
      {
        type: 'value',
        name: '成交客户数',
        min: 0,
        minInterval: 1, // 显示整数刻度
        splitLine: {
          lineStyle: {
            type: 'dotted', // 右侧网格线虚化, 减少混乱
            opacity: 0.7,
          },
        },
      },
    ],
    xAxis: {
      type: 'category',
      name: '日期',
      data: res.map((item: any) => item.time),
    },
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useSummaryGridColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_, formValues) => {
          const res = await getCustomerSummaryByDate(formValues);
          setChartData(res);
          return await getCustomerSummaryByUser(formValues);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<CrmStatisticsCustomerApi.CustomerSummaryByUser>,
});

function handleTabChange(key: any) {
  activeTabName.value = key;
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #top>
        <Tabs v-model:active-key="activeTabName" @change="handleTabChange">
          <Tabs.TabPane
            tab="客户总量分析"
            key="customerSummary"
            :force-render="true"
          />
          <Tabs.TabPane
            tab="客户跟进次数分析"
            key="followUpSummary"
            :force-render="true"
          />
        </Tabs>
        <EchartsUI class="mb-20 h-full w-full" ref="chartRef" />
      </template>
    </Grid>
  </Page>
</template>
