<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { MallMemberStatisticsApi } from '#/api/mall/statistics/member';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card } from 'ant-design-vue';

import * as MemberStatisticsApi from '#/api/mall/statistics/member';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

// 获取字典选项
function getIntDictOptions(dictType: string) {
  return getDictOptions(dictType, 'number');
}

import { getSexChartOptions } from './sex-chart-options';

/** 会员性别比例卡片 */
defineOptions({ name: 'MemberSexCard' });

const loading = ref(true);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 按照性别，查询会员统计列表 */
async function getMemberSexStatisticsList() {
  loading.value = true;
  try {
    const list = await MemberStatisticsApi.getMemberSexStatisticsList();
    const dictDataList = getIntDictOptions(DICT_TYPE.SYSTEM_USER_SEX);
    dictDataList.push({ label: '未知', value: null } as any);
    
    const chartData = dictDataList.map((dictData: any) => {
      const userCount = list.find(
        (item: MallMemberStatisticsApi.SexStatistics) => item.sex === dictData.value,
      )?.userCount;
      return {
        name: dictData.label,
        value: userCount || 0,
      };
    });
    
    await renderEcharts(getSexChartOptions(chartData));
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getMemberSexStatisticsList();
});
</script>

<template>
  <Card :bordered="false" title="会员性别比例" :loading="loading">
    <EchartsUI ref="chartRef" class="h-[300px] w-full" />
  </Card>
</template>
