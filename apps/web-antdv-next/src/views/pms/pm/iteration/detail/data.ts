import type { EChartsOption } from '@vben/plugins/echarts';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { PmsWorkItemStatusType } from '#/views/pms/pm/utils/constants';

type BurnDown = PmsIterationApi.IterationOverview['burnDowns'][number];

/** 列表的字段 */
export function useBurnDownColumns(): VxeTableGridOptions<BurnDown>['columns'] {
  return [
    {
      field: 'date',
      title: '日期',
      minWidth: 140,
    },
    {
      align: 'center',
      field: 'idealRemaining',
      title: '理想剩余工时',
      minWidth: 140,
    },
    {
      align: 'center',
      field: 'actualRemaining',
      title: '实际剩余工时',
      minWidth: 140,
    },
  ];
}

/** 近 14 天事项状态趋势图配置 */
export function getStatusTrendChartOptions(
  overview: PmsIterationApi.IterationOverview,
): EChartsOption {
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, data: ['已完成', '进行中', '未开始'] },
    grid: { top: 40, right: 16, bottom: 12, left: 12, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: overview.statusTrends.map((item) => item.date.slice(5)),
    },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
      {
        name: '已完成',
        type: 'line',
        data: overview.statusTrends.map((item) => item.completedCount),
        itemStyle: { color: '#36b37e' },
      },
      {
        name: '进行中',
        type: 'line',
        data: overview.statusTrends.map((item) => item.processingCount),
        itemStyle: { color: '#ffab00' },
      },
      {
        name: '未开始',
        type: 'line',
        data: overview.statusTrends.map((item) => item.pendingCount),
        itemStyle: { color: '#0065ff' },
      },
    ],
  };
}

/** 事项类型和状态交叉分布图配置 */
export function getDistributionChartOptions(
  overview: PmsIterationApi.IterationOverview,
  typeDistribution: { name: string; type: number }[],
): EChartsOption {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, data: ['已完成', '进行中', '未开始'] },
    grid: { top: 10, right: 16, bottom: 36, left: 12, containLabel: true },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: {
      type: 'category',
      data: typeDistribution.map((item) => item.name),
    },
    series: [
      {
        name: '已完成',
        type: 'bar',
        stack: 'total',
        data: typeDistribution.map(
          (item) =>
            overview.typeStatusCountMap[item.type]?.[
              PmsWorkItemStatusType.COMPLETED
            ] || 0,
        ),
        itemStyle: { color: '#36b37e' },
      },
      {
        name: '进行中',
        type: 'bar',
        stack: 'total',
        data: typeDistribution.map(
          (item) =>
            overview.typeStatusCountMap[item.type]?.[
              PmsWorkItemStatusType.PROCESSING
            ] || 0,
        ),
        itemStyle: { color: '#ffab00' },
      },
      {
        name: '未开始',
        type: 'bar',
        stack: 'total',
        data: typeDistribution.map(
          (item) =>
            overview.typeStatusCountMap[item.type]?.[
              PmsWorkItemStatusType.PENDING
            ] || 0,
        ),
        itemStyle: { color: '#0065ff' },
      },
    ],
  };
}
