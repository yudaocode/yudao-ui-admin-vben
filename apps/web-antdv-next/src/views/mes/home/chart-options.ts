import type { EChartsOption } from '@vben/plugins/echarts';

/** 生产趋势折线图配置 */
export function getProductionTrendChartOptions(
  dates: string[],
  quantities: number[],
  qualified: number[],
  unqualified: number[],
): EChartsOption {
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
): EChartsOption {
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
