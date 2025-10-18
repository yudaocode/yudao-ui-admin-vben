<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { Dayjs } from 'dayjs';

import { onMounted, ref } from 'vue';

import dayjs from 'dayjs';
import { Card, Radio, RadioGroup, Spin } from 'ant-design-vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { fenToYuan } from '@vben/utils';

import * as TradeStatisticsApi from '#/api/mall/statistics/trade';

import { getTradeTrendChartOptions } from './trade-trend-chart-options';

/** 交易量趋势 */
defineOptions({ name: 'TradeTrendCard' });

enum TimeRangeTypeEnum {
  DAY30 = 1,
  WEEK = 7,
  MONTH = 30,
  YEAR = 365,
}

const timeRangeType = ref(TimeRangeTypeEnum.DAY30); // 日期快捷选择按钮, 默认30天
const loading = ref(false);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 时间范围 Map
const timeRangeConfig = {
  [TimeRangeTypeEnum.DAY30]: {
    name: '30天',
    seriesCount: 2,
  },
  [TimeRangeTypeEnum.WEEK]: {
    name: '周',
    seriesCount: 4,
  },
  [TimeRangeTypeEnum.MONTH]: {
    name: '月',
    seriesCount: 4,
  },
  [TimeRangeTypeEnum.YEAR]: {
    name: '年',
    seriesCount: 4,
  },
};

/** 时间范围类型单选按钮选中 */
const handleTimeRangeTypeChange = async () => {
  // 设置时间范围
  let beginTime: Dayjs;
  let endTime: Dayjs;
  switch (timeRangeType.value) {
    case TimeRangeTypeEnum.WEEK: {
      beginTime = dayjs().startOf('week');
      endTime = dayjs().endOf('week');
      break;
    }
    case TimeRangeTypeEnum.MONTH: {
      beginTime = dayjs().startOf('month');
      endTime = dayjs().endOf('month');
      break;
    }
    case TimeRangeTypeEnum.YEAR: {
      beginTime = dayjs().startOf('year');
      endTime = dayjs().endOf('year');
      break;
    }
    case TimeRangeTypeEnum.DAY30:
    default: {
      beginTime = dayjs().subtract(30, 'day').startOf('d');
      endTime = dayjs().endOf('d');
      break;
    }
  }
  // 发送时间范围选中事件
  await getOrderCountTrendComparison(beginTime, endTime);
};

/** 查询订单数量趋势对照数据 */
const getOrderCountTrendComparison = async (
  beginTime: dayjs.ConfigType,
  endTime: dayjs.ConfigType,
) => {
  loading.value = true;
  try {
    // 查询数据
    const list = await TradeStatisticsApi.getOrderCountTrendComparison(
      timeRangeType.value,
      beginTime,
      endTime,
    );
    // 处理数据
    const dates: string[] = [];
    const series: any[] = [];
    const config = timeRangeConfig[timeRangeType.value];

    if (config.seriesCount === 2) {
      const orderPayPriceData: number[] = [];
      const orderPayCountData: number[] = [];
      for (const item of list) {
        dates.push(item.value.date);
        orderPayPriceData.push(fenToYuan(item?.value?.orderPayPrice || 0));
        orderPayCountData.push(item?.value?.orderPayCount || 0);
      }
      series.push(
        { name: '订单金额', type: 'bar', smooth: true, data: orderPayPriceData },
        {
          name: '订单数量',
          type: 'line',
          smooth: true,
          data: orderPayCountData,
        },
      );
    } else {
      const refPriceData: number[] = [];
      const curPriceData: number[] = [];
      const refCountData: number[] = [];
      const curCountData: number[] = [];

      for (const item of list) {
        dates.push(item.value.date);
        refPriceData.push(fenToYuan(item?.reference?.orderPayPrice || 0));
        curPriceData.push(fenToYuan(item?.value?.orderPayPrice || 0));
        refCountData.push(item?.reference?.orderPayCount || 0);
        curCountData.push(item?.value?.orderPayCount || 0);
      }

      const timeLabel =
        timeRangeType.value === TimeRangeTypeEnum.WEEK
          ? ['上周', '本周']
          : timeRangeType.value === TimeRangeTypeEnum.MONTH
            ? ['上月', '本月']
            : ['去年', '今年'];

      series.push(
        {
          name: `${timeLabel[0]}金额`,
          type: 'bar',
          smooth: true,
          data: refPriceData,
        },
        {
          name: `${timeLabel[1]}金额`,
          type: 'bar',
          smooth: true,
          data: curPriceData,
        },
        {
          name: `${timeLabel[0]}数量`,
          type: 'line',
          smooth: true,
          data: refCountData,
        },
        {
          name: `${timeLabel[1]}数量`,
          type: 'line',
          smooth: true,
          data: curCountData,
        },
      );
    }

    await renderEcharts(
      getTradeTrendChartOptions(dates, series, timeRangeType.value),
    );
  } finally {
    loading.value = false;
  }
};

/** 初始化 */
onMounted(() => {
  handleTimeRangeTypeChange();
});
</script>

<template>
  <Card :bordered="false">
    <template #title>
      <div class="flex items-center justify-between">
        <span>交易量趋势</span>
        <RadioGroup v-model:value="timeRangeType" @change="handleTimeRangeTypeChange">
          <Radio
            v-for="[key, value] in Object.entries(timeRangeConfig)"
            :key="key"
            :value="Number(key)"
          >
            {{ value.name }}
          </Radio>
        </RadioGroup>
      </div>
    </template>
    <Spin :spinning="loading">
      <EchartsUI ref="chartRef" class="h-[300px] w-full" />
    </Spin>
  </Card>
</template>

