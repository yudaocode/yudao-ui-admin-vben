<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictObj } from '@vben/hooks';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card } from 'antdv-next';

import {
  getGroupSizeDistribution,
  getMessageTypeDistribution,
  getTopSenders,
} from '#/api/im/manager/statistics';

const props = defineProps<{
  type: 'groupSize' | 'messageType' | 'topSenders';
}>();

const titleMap = {
  groupSize: '群规模分布',
  messageType: '消息类型分布',
  topSenders: '消息发送 TOP 10',
};

const loading = ref(false);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

/** 加载图表数据 */
async function loadData() {
  loading.value = true;
  try {
    await nextTick();
    if (props.type === 'groupSize') {
      const data = await getGroupSizeDistribution();
      await renderEcharts({
        tooltip: { trigger: 'axis' },
        grid: { left: 24, right: 24, bottom: 16, top: 28, containLabel: true },
        xAxis: { type: 'category', data: data.map((item) => item.range) },
        yAxis: { type: 'value', name: '群组数' },
        series: [
          {
            type: 'bar',
            data: data.map((item) => item.count),
            itemStyle: { color: '#18a058', borderRadius: [4, 4, 0, 0] },
            barMaxWidth: 48,
          },
        ],
      });
      return;
    }
    if (props.type === 'messageType') {
      const data = await getMessageTypeDistribution();
      const items = data.map((item) => ({
        name:
          getDictObj(DICT_TYPE.IM_CONTENT_TYPE, String(item.type))?.label ||
          `未知(${item.type})`,
        value: item.value,
      }));
      await renderEcharts({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', right: 8, top: 'middle' },
        series: [
          {
            type: 'pie',
            radius: ['42%', '70%'],
            data: items,
            itemStyle: { borderColor: '#fff', borderRadius: 4, borderWidth: 2 },
            label: { show: false },
          },
        ],
      });
      return;
    }
    const data = await getTopSenders();
    const sorted = data.toSorted((a, b) => a.messageCount - b.messageCount);
    await renderEcharts({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 24, right: 24, bottom: 16, top: 20, containLabel: true },
      xAxis: { type: 'value', name: '消息数' },
      yAxis: {
        type: 'category',
        data: sorted.map(
          (item) => `${item.nickname || item.userId}(${item.userId})`,
        ),
        axisLabel: { overflow: 'truncate', width: 110 },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((item) => item.messageCount),
          itemStyle: { color: '#2f7df6', borderRadius: [0, 4, 4, 0] },
          barMaxWidth: 18,
        },
      ],
    });
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <Card
    :styles="{ body: { padding: '12px 16px 16px' } }"
    :title="titleMap[type]"
  >
    <div class="relative min-h-[320px]">
      <EchartsUI ref="chartRef" height="320px" />
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center bg-card/70 text-sm text-muted-foreground"
      >
        加载中
      </div>
    </div>
  </Card>
</template>
