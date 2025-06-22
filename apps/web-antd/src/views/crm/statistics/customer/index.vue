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
  getCustomerDealCycleByUser,
  getCustomerSummaryByDate,
  getCustomerSummaryByUser,
  getDatas,
} from '#/api/crm/statistics/customer';

import { getChartOptions } from './chartOptions';
import { customerSummaryTabs, useGridColumns, useGridFormSchema } from './data';

const activeTabName = ref('customerSummary');
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(activeTabName.value),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async (_, formValues) => {
          const res = await getCustomerSummaryByDate(formValues);
          renderEcharts(getChartOptions(activeTabName.value, res));
          return await getDatas(activeTabName.value, formValues);
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

async function handleTabChange(key: any) {
  activeTabName.value = key;
  const params = (await gridApi.formApi.getValues()) as any;
  switch (key) {
    case 'conversionStat': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerSummaryByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'customerSummary': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerSummaryByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'dealCycleByArea': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerDealCycleByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'dealCycleByProduct': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerDealCycleByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'dealCycleByUser': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerDealCycleByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'followUpSummary': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerSummaryByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'followUpType': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerSummaryByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    case 'poolSummary': {
      gridApi.setGridOptions({
        columns: useGridColumns(key),
      });
      const data = await getCustomerSummaryByUser(params);
      renderEcharts(getChartOptions(key, data), true);
      break;
    }
    default: {
      break;
    }
  }
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #top>
        <Tabs v-model:active-key="activeTabName" @change="handleTabChange">
          <Tabs.TabPane
            v-for="item in customerSummaryTabs"
            :key="item.key"
            :tab="item.tab"
            :force-render="true"
          />
        </Tabs>
        <EchartsUI class="mb-20 h-full w-full" ref="chartRef" />
      </template>
    </Grid>
  </Page>
</template>
