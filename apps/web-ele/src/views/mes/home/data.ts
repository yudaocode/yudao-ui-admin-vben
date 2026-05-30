import type { MesHomeApi } from '#/api/mes/home';

import { MesProWorkOrderStatusEnum } from '#/views/mes/utils/constants';

/** 首页汇总统计默认值 */
export const defaultSummary: MesHomeApi.Summary = {
  andonActiveCount: 0,
  machineryMaintenance: 0,
  machineryProducing: 0,
  machineryStop: 0,
  machineryTotal: 0,
  repairActiveCount: 0,
  todayOutput: 0,
  todayQualifiedQuantity: 0,
  todayUnqualifiedQuantity: 0,
  workOrderActiveCount: 0,
  workOrderFinishedCount: 0,
  workOrderPrepareCount: 0,
  yesterdayOutput: 0,
};

/** 工单状态对应的颜色映射 */
export const WORK_ORDER_STATUS_COLOR_MAP: Record<number, string> = {
  [MesProWorkOrderStatusEnum.PREPARE]: '#909399', // 草稿
  [MesProWorkOrderStatusEnum.CONFIRMED]: '#409EFF', // 已确认
  [MesProWorkOrderStatusEnum.FINISHED]: '#67C23A', // 已完成
  [MesProWorkOrderStatusEnum.CANCELED]: '#F56C6C', // 已取消
};

/** 生产趋势折线图配置 */
export function getProductionTrendChartOptions(
  dates: string[],
  quantities: number[],
  qualified: number[],
  unqualified: number[],
): any {
  return {
    grid: { bottom: 40, left: 50, right: 20, top: 20 },
    legend: { bottom: 0, data: ['产量', '合格品', '不良品'] },
    series: [
      {
        areaStyle: { color: 'rgba(64,158,255,0.15)' },
        data: quantities,
        itemStyle: { color: '#409EFF' },
        name: '产量',
        smooth: true,
        type: 'line',
      },
      {
        data: qualified,
        itemStyle: { color: '#67C23A' },
        name: '合格品',
        smooth: true,
        type: 'line',
      },
      {
        data: unqualified,
        itemStyle: { color: '#F56C6C' },
        name: '不良品',
        smooth: true,
        type: 'line',
      },
    ],
    tooltip: { axisPointer: { type: 'cross' }, trigger: 'axis' },
    xAxis: { boundaryGap: false, data: dates, type: 'category' },
    yAxis: { minInterval: 1, type: 'value' },
  };
}

/** 工单状态分布饼图配置 */
export function getWorkOrderStatusChartOptions(
  data: Array<{ itemStyle: { color: string }; name: string; value: number }>,
): any {
  return {
    legend: { bottom: 0, type: 'scroll' },
    series: [
      {
        avoidLabelOverlap: true,
        data,
        emphasis: { label: { fontSize: 14, fontWeight: 'bold', show: true } },
        itemStyle: { borderColor: '#fff', borderRadius: 6, borderWidth: 2 },
        label: { formatter: '{b}\n{c}', show: true },
        radius: ['40%', '70%'],
        type: 'pie',
      },
    ],
    tooltip: { formatter: '{b}: {c} ({d}%)', trigger: 'item' },
  };
}
