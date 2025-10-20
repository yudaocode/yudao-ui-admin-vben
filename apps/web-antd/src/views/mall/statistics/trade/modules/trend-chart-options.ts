import type { EChartsOption } from 'echarts';

import type { MallTradeStatisticsApi } from '#/api/mall/statistics/trade';

/** 交易趋势折线图配置 */
export function getTradeTrendChartOptions(
  data: MallTradeStatisticsApi.TradeTrendSummary[],
): EChartsOption {
  return {
    dataset: {
      dimensions: [
        'time',
        'turnoverPrice',
        'orderPayPrice',
        'rechargePrice',
        'expensePrice',
      ],
      source: data,
    },
    grid: {
      left: 20,
      right: 20,
      bottom: 20,
      top: 80,
      containLabel: true,
    },
    legend: {
      top: 50,
    },
    series: [
      {
        name: '营业额',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#1890FF' },
      },
      {
        name: '商品支付金额',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#722ED1' },
      },
      {
        name: '充值金额',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#FAAD14' },
      },
      {
        name: '支出金额',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#52C41A' },
      },
    ],
    toolbox: {
      feature: {
        // 数据区域缩放
        dataZoom: {
          yAxisIndex: false, // Y轴不缩放
        },
        brush: {
          type: ['lineX', 'clear'], // 区域缩放按钮、还原按钮
        },
        saveAsImage: {
          show: true,
          name: '交易状况',
        }, // 保存为图片
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      padding: [5, 10],
      formatter(params: any) {
        let result = `<div><strong>${params[0].data.time}</strong></div>`;
        params.forEach((item: any) => {
          result += `<div style="margin: 4px 0;">
            <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>
            ${item.seriesName}: ￥${item.data[item.dimensionNames[item.encode.y[0]]]}
          </div>`;
        });
        return result;
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      axisTick: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: '￥{value}',
        color: '#7F8B9C',
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#F5F7F9',
        },
      },
    },
  };
}
