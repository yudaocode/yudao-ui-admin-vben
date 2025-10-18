<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { Card, Spin } from 'ant-design-vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { getDictOptions } from '@vben/hooks';

import * as MemberStatisticsApi from '#/api/mall/statistics/member';

import { getTerminalChartOptions } from './member-terminal-chart-options';

/** 会员终端卡片 */
defineOptions({ name: 'MemberTerminalCard' });

const loading = ref(true);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 按照终端，查询会员统计列表 */
const getMemberTerminalStatisticsList = async () => {
  loading.value = true;
  try {
    const list = await MemberStatisticsApi.getMemberTerminalStatisticsList();
    const dictDataList = getDictOptions('terminal');
    const chartData = dictDataList.map((dictData: any) => {
      const userCount = list.find(
        (item: any) => item.terminal === dictData.value,
      )?.userCount;
      return {
        name: dictData.label,
        value: userCount || 0,
      };
    });
    await renderEcharts(getTerminalChartOptions(chartData));
  } finally {
    loading.value = false;
  }
};

/** 初始化 */
onMounted(() => {
  getMemberTerminalStatisticsList();
});
</script>

<template>
  <Card :bordered="false" title="会员终端">
    <Spin :spinning="loading">
      <EchartsUI ref="chartRef" class="h-[300px] w-full" />
    </Spin>
  </Card>
</template>

