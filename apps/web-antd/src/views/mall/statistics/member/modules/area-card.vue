<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { MallMemberStatisticsApi } from '#/api/mall/statistics/member';

import { onMounted, ref, shallowRef } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { fenToYuan } from '@vben/utils';

import { Card, Spin, Table } from 'ant-design-vue';

import * as MemberStatisticsApi from '#/api/mall/statistics/member';

import { getAreaChartOptions } from './area-chart-options';

/** 会员地域分布卡片 */
defineOptions({ name: 'MemberAreaCard' });

const loading = ref(true);
const areaStatisticsList = shallowRef<MallMemberStatisticsApi.AreaStatistics[]>(
  [],
);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 城市名兼容：ercharts 地名存在差异 */
function areaReplace(areaName: string) {
  if (!areaName) {
    return areaName;
  }
  return areaName
    .replace('维吾尔自治区', '')
    .replace('壮族自治区', '')
    .replace('回族自治区', '')
    .replace('自治区', '')
    .replace('省', '');
}

/** 表格列配置 */
const columns = [
  {
    title: '省份',
    dataIndex: 'areaName',
    key: 'areaName',
    width: 80,
    sorter: true,
    ellipsis: true,
  },
  {
    title: '会员数量',
    dataIndex: 'userCount',
    key: 'userCount',
    width: 100,
    sorter: (a: any, b: any) => (a.userCount || 0) - (b.userCount || 0),
  },
  {
    title: '订单创建数量',
    dataIndex: 'orderCreateUserCount',
    key: 'orderCreateUserCount',
    width: 120,
    sorter: (a: any, b: any) =>
      (a.orderCreateUserCount || 0) - (b.orderCreateUserCount || 0),
  },
  {
    title: '订单支付数量',
    dataIndex: 'orderPayUserCount',
    key: 'orderPayUserCount',
    width: 120,
    sorter: (a: any, b: any) =>
      (a.orderPayUserCount || 0) - (b.orderPayUserCount || 0),
  },
  {
    title: '订单支付金额',
    dataIndex: 'orderPayPrice',
    key: 'orderPayPrice',
    width: 120,
    sorter: (a: any, b: any) => (a.orderPayPrice || 0) - (b.orderPayPrice || 0),
    customRender: ({ record }: any) =>
      `￥${Number(fenToYuan(record.orderPayPrice || 0)).toFixed(2)}`,
  },
];

/** 按照省份，查询会员统计列表 */
async function getMemberAreaStatisticsList() {
  loading.value = true;
  try {
    const list = await MemberStatisticsApi.getMemberAreaStatisticsList();

    areaStatisticsList.value = list.map(
      (item: MallMemberStatisticsApi.AreaStatistics) => ({
        ...item,
        areaName: areaReplace(item.areaName),
      }),
    );

    // 渲染图表
    const chartOptions = getAreaChartOptions(areaStatisticsList.value);

    await renderEcharts(chartOptions);
  } catch (error) {
    console.error('地域分布数据获取失败:', error);
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getMemberAreaStatisticsList();
});
</script>

<template>
  <Card :bordered="false" title="会员地域分布" class="h-full">
    <Spin :spinning="loading">
      <div class="flex gap-4">
        <div class="w-2/5">
          <EchartsUI ref="chartRef" class="h-[300px] w-full" />
        </div>
        <div class="w-3/5">
          <Table
            :data-source="areaStatisticsList"
            :columns="columns"
            :scroll="{ y: 260 }"
            size="small"
            :pagination="false"
            bordered
          />
        </div>
      </div>
    </Spin>
  </Card>
</template>
