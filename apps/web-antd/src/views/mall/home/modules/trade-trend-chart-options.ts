import dayjs from 'dayjs';

/**
 * 交易量趋势图表配置
 */
export function getTradeTrendChartOptions(
  dates: string[],
  series: any[],
  timeRangeType: number,
): any {
  return {
    grid: {
      left: 20,
      right: 20,
      bottom: 20,
      top: 80,
      containLabel: true,
    },
    legend: {
      top: 50,
      data: series.map((item) => item.name),
    },
    series,
    toolbox: {
      feature: {
        // 数据区域缩放
        dataZoom: {
          yAxisIndex: false, // Y轴不缩放
        },
        brush: {
          type: ['lineX', 'clear'], // 区域缩放按钮、还原按钮
        },
        saveAsImage: { show: true, name: '订单量趋势' }, // 保存为图片
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      padding: [5, 10],
    },
    xAxis: {
      type: 'category',
      inverse: true,
      boundaryGap: false,
      axisTick: {
        show: false,
      },
      data: dates,
      axisLabel: {
        formatter: (date: string) => {
          switch (timeRangeType) {
            case 1: // DAY30
              return dayjs(date).format('MM-DD');
            case 7: // WEEK
              {
                const weekDay = dayjs(date).day();
                return weekDay === 0 ? '周日' : `周${weekDay}`;
              }
            case 30: // MONTH
              return dayjs(date).format('D');
            case 365: // YEAR
              return dayjs(date).format('M') + '月';
            default:
              return date;
          }
        },
      },
    },
    yAxis: {
      axisTick: {
        show: false,
      },
    },
  };
}

