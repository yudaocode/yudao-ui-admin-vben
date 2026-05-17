import type { WmsHomeStatisticsApi } from '#/api/wms/home';

import { DICT_TYPE } from '@vben/constants';
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

const OrderTypeEnum = {
  CHECK: 4,
  MOVEMENT: 3,
  RECEIPT: 1,
  SHIPMENT: 2,
} as const;

/** 获取 WMS 单据类型标题，用于消除字典里的“单”后缀 */
function getOrderTypeTitle(type: number, defaultTitle: string) {
  const label = getDictLabel(DICT_TYPE.WMS_ORDER_TYPE, type) || defaultTitle;
  return label.endsWith('单') ? label.slice(0, -1) : label;
}

const orderDefinitions: OrderDefinition[] = [
  {
    color: '#2f7df6',
    title: getOrderTypeTitle(OrderTypeEnum.RECEIPT, '入库'),
    trendField: 'receiptCount',
    type: OrderTypeEnum.RECEIPT,
  },
  {
    color: '#18a058',
    title: getOrderTypeTitle(OrderTypeEnum.SHIPMENT, '出库'),
    trendField: 'shipmentCount',
    type: OrderTypeEnum.SHIPMENT,
  },
  {
    color: '#f59e0b',
    title: getOrderTypeTitle(OrderTypeEnum.MOVEMENT, '移库'),
    trendField: 'movementCount',
    type: OrderTypeEnum.MOVEMENT,
  },
  {
    color: '#7c3aed',
    title: getOrderTypeTitle(OrderTypeEnum.CHECK, '盘库'),
    trendField: 'checkCount',
    type: OrderTypeEnum.CHECK,
  },
];

/** 格式化趋势接口返回的时间戳为图表横轴日期 */
function formatTrendTime(time: number | string) {
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? `${time}` : (formatDate(date, 'MM-DD') as string);
}

/** 单据趋势图表配置 */
export function getOrderTrendChartOptions(list: WmsHomeStatisticsApi.OrderTrend[]): any {
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
