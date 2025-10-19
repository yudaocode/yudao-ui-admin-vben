<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { getDictOptions } from '@vben/hooks';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { ElCard } from 'element-plus';

import * as MemberStatisticsApi from '#/api/mall/statistics/member';

import { getTerminalChartOptions } from './terminal-chart-options';

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
    const dictDataList = getDictOptions('terminal', 'number');
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
  <ElCard :border="false" class="h-full">
    <template #header>
      <div>会员终端</div>
    </template>
    <div v-loading="loading">
      <EchartsUI ref="chartRef" />
    </div>
  </ElCard>
</template>
