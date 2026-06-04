import type { EChartsOption } from '@vben/plugins/echarts';

import type { WmsHomeStatisticsApi } from '#/api/wms/home';

import { DICT_TYPE, OrderTypeEnum } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate } from '@vben/utils';

interface OrderDefinition {
  color: string;
  title: string;
  trendField: keyof Pick<
    WmsHomeStatisticsApi.OrderTrend,
    'checkCount' | 'movementCount' | 'receiptCount' | 'shipmentCount'
  >;
  type: number;
}

const orderDefinitions: OrderDefinition[] = [
  {
    color: '#2f7df6',
    title: getDictLabel(
      DICT_TYPE.WMS_ORDER_TYPE,
      OrderTypeEnum.RECEIPT,
    ).replace(/单$/, ''),
    trendField: 'receiptCount',
    type: OrderTypeEnum.RECEIPT,
  },
  {
    color: '#18a058',
    title: getDictLabel(
      DICT_TYPE.WMS_ORDER_TYPE,
      OrderTypeEnum.SHIPMENT,
    ).replace(/单$/, ''),
    trendField: 'shipmentCount',
    type: OrderTypeEnum.SHIPMENT,
  },
  {
    color: '#f59e0b',
    title: getDictLabel(
      DICT_TYPE.WMS_ORDER_TYPE,
      OrderTypeEnum.MOVEMENT,
    ).replace(/单$/, ''),
    trendField: 'movementCount',
    type: OrderTypeEnum.MOVEMENT,
  },
  {
    color: '#7c3aed',
    title: getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, OrderTypeEnum.CHECK).replace(
      /单$/,
      '',
    ),
    trendField: 'checkCount',
    type: OrderTypeEnum.CHECK,
  },
];

/** 格式化趋势接口返回的时间戳为图表横轴日期 */
function formatTrendTime(time: number | string) {
  const date = new Date(time);
  return Number.isNaN(date.getTime())
    ? `${time}`
    : (formatDate(date, 'MM-DD') as string);
}

/** 单据趋势图表配置 */
export function getOrderTrendChartOptions(
  list: WmsHomeStatisticsApi.OrderTrend[],
): EChartsOption {
  const labels = list.map((item) => formatTrendTime(item.time));
  return {
    color: orderDefinitions.map((item) => item.color),
    grid: { bottom: 24, containLabel: true, left: 28, right: 24, top: 48 },
    legend: { itemHeight: 10, itemWidth: 10, top: 6 },
    series: orderDefinitions.map((item) => ({
      barMaxWidth: 18,
      data: list.map((row) => Number(row[item.trendField] || 0)),
      emphasis: { focus: 'series' },
      name: item.title,
      type: 'bar',
    })),
    tooltip: { axisPointer: { type: 'shadow' }, trigger: 'axis' },
    xAxis: {
      axisLine: { lineStyle: { color: '#dcdfe6' } },
      axisTick: { show: false },
      data: labels,
      type: 'category',
    },
    yAxis: {
      minInterval: 1,
      name: '单据数',
      splitLine: { lineStyle: { color: '#eef2f7' } },
      type: 'value',
    },
  };
}
