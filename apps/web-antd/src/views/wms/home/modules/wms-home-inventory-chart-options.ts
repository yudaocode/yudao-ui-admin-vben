import type { EChartsOption } from '@vben/plugins/echarts';

import type { WmsHomeStatisticsApi } from '#/api/wms/home';

import { formatQuantity } from '#/views/wms/utils/format';

export interface InventoryChartItem {
  name: string;
  value: number;
}

/** 格式化库存数量展示文本 */
export function formatQuantityText(value?: number) {
  return formatQuantity(value || 0) || '0.00';
}

/** 转换库存排行接口数据为 ECharts 可消费的 name/value 数据 */
export function buildInventoryChartItemList(
  list: undefined | WmsHomeStatisticsApi.InventoryRankItem[],
  emptyName: string,
) {
  return (list || [])
    .map((item) => ({
      name: item.name || emptyName,
      value: Number(item.quantity || 0),
    }))
    .filter((item) => item.value > 0);
}

/** 格式化货物占比图例，补充当前商品库存占比 */
function formatGoodsLegend(name: string, goodsShareList: InventoryChartItem[]) {
  const total = goodsShareList.reduce((sum, item) => sum + item.value, 0);
  const item = goodsShareList.find((goods) => goods.name === name);
  if (!total || !item) {
    return name;
  }
  return `${name}  ${((item.value / total) * 100).toFixed(1)}%`;
}

/** 货物占比图表配置 */
export function getGoodsShareChartOptions(
  goodsShareList: InventoryChartItem[],
): EChartsOption {
  return {
    color: ['#2f7df6', '#18a058', '#f59e0b', '#7c3aed', '#14b8a6'],
    legend: {
      formatter: (name: string) => formatGoodsLegend(name, goodsShareList),
      itemHeight: 10,
      itemWidth: 10,
      orient: 'vertical',
      right: 10,
      top: 'middle',
      type: 'scroll',
    },
    series: [
      {
        avoidLabelOverlap: true,
        center: ['34%', '52%'],
        data: goodsShareList,
        label: { show: false },
        labelLine: { show: false },
        name: '货物占比',
        radius: ['48%', '70%'],
        type: 'pie',
      },
    ],
    tooltip: {
      formatter: '{b}<br/>库存：{c} ({d}%)',
      trigger: 'item',
    },
  };
}

/** 库存分布图表配置 */
export function getWarehouseDistributionChartOptions(
  warehouseDistributionList: InventoryChartItem[],
): EChartsOption {
  const sortedList = warehouseDistributionList.toReversed();
  return {
    color: ['#2f7df6'],
    grid: { bottom: 16, containLabel: true, left: 24, right: 40, top: 12 },
    series: [
      {
        barMaxWidth: 16,
        data: sortedList.map((item) => item.value),
        label: {
          formatter: ({ value }) => formatQuantityText(Number(value || 0)),
          position: 'right',
          show: true,
        },
        name: '库存',
        type: 'bar',
      },
    ],
    tooltip: {
      formatter: (params: unknown) => {
        const item = (Array.isArray(params) ? params[0] : params) as {
          name?: string;
          value?: number;
        };
        return `${item.name || '-'}<br/>库存：${formatQuantityText(item.value)}`;
      },
      trigger: 'axis',
    },
    xAxis: {
      splitLine: { lineStyle: { color: '#eef2f7' } },
      type: 'value',
    },
    yAxis: {
      axisLine: { show: false },
      axisTick: { show: false },
      data: sortedList.map((item) => item.name),
      type: 'category',
    },
  };
}
