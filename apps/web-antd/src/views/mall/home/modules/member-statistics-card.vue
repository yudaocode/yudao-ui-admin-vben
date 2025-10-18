<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import dayjs from 'dayjs';
import { Card, Spin } from 'ant-design-vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import * as MemberStatisticsApi from '#/api/mall/statistics/member';

import { getMemberStatisticsChartOptions } from './member-statistics-chart-options';

/** 会员用户统计卡片 */
defineOptions({ name: 'MemberStatisticsCard' });

const loading = ref(false);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const getMemberRegisterCountList = async () => {
  loading.value = true;
  try {
    // 查询最近一月数据
    const beginTime = dayjs().subtract(30, 'd').startOf('d');
    const endTime = dayjs().endOf('d');
    const list = await MemberStatisticsApi.getMemberRegisterCountList(
      beginTime,
      endTime,
    );
    // 更新 Echarts 数据
    await renderEcharts(getMemberStatisticsChartOptions(list));
  } finally {
    loading.value = false;
  }
};

/** 初始化 */
onMounted(() => {
  getMemberRegisterCountList();
});
</script>

<template>
  <Card :bordered="false" title="用户统计">
    <Spin :spinning="loading">
      <EchartsUI ref="chartRef" class="h-[300px] w-full" />
    </Spin>
  </Card>
</template>

