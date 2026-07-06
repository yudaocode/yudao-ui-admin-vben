import { erpCalculatePercentage, erpPriceInputFormatter } from '@vben/utils';

const getLegend = (extra: Record<string, any> = {}) => ({
  top: 10,
  ...extra,
});

const getGrid = (extra: Record<string, any> = {}) => ({
  left: 20,
  right: 20,
  bottom: 20,
  containLabel: true,
  ...extra,
});

const getTooltip = (extra: Record<string, any> = {}) => ({
  trigger: 'axis',
  axisPointer: {
    type: 'shadow',
  },
  ...extra,
});

export function getChartOptions(
  activeTabName: any,
  active: boolean,
  res: any,
): any {
  switch (activeTabName) {
    case 'businessInversionRateSummary': {
      return {
        color: ['#6ca2ff', '#6ac9d7', '#ff7474'],
        tooltip: getTooltip(),
        legend: getLegend({
          data: ['赢单转化率', '商机总数', '赢单商机数'],
          bottom: '0px',
          itemWidth: 14,
        }),
        grid: getGrid({
          top: '40px',
          left: '40px',
          right: '40px',
          bottom: '40px',
          borderColor: '#fff',
        }),
        xAxis: [
          {
            type: 'category',
            data: res.map((s: any) => s.time),
            axisTick: {
              alignWithLabel: true,
              lineStyle: { width: 0 },
            },
            axisLabel: {
              color: '#BDBDBD',
            },
            /** 坐标轴轴线相关设置 */
            axisLine: {
              lineStyle: { color: '#BDBDBD' },
            },
            splitLine: {
              show: false,
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            name: '赢单转化率',
            axisTick: {
              alignWithLabel: true,
              lineStyle: { width: 0 },
            },
            axisLabel: {
              color: '#BDBDBD',
              formatter: '{value}%',
            },
            /** 坐标轴轴线相关设置 */
            axisLine: {
              lineStyle: { color: '#BDBDBD' },
            },
            splitLine: {
              show: false,
            },
          },
          {
            type: 'value',
            name: '商机数',
            axisTick: {
              alignWithLabel: true,
              lineStyle: { width: 0 },
            },
            axisLabel: {
              color: '#BDBDBD',
              formatter: '{value}个',
            },
            /** 坐标轴轴线相关设置 */
            axisLine: {
              lineStyle: { color: '#BDBDBD' },
            },
            splitLine: {
              show: false,
            },
          },
        ],
        series: [
          {
            name: '赢单转化率',
            type: 'line',
            yAxisIndex: 0,
            data: res.map((s: any) =>
              erpCalculatePercentage(s.businessWinCount, s.businessCount),
            ),
          },
          {
            name: '商机总数',
            type: 'bar',
            yAxisIndex: 1,
            barWidth: 15,
            data: res.map((s: any) => s.businessCount),
          },
          {
            name: '赢单商机数',
            type: 'bar',
            yAxisIndex: 1,
            barWidth: 15,
            data: res.map((s: any) => s.businessWinCount),
          },
        ],
      };
    }
    case 'businessSummary': {
      return {
        grid: getGrid({
          left: 30,
          right: 30, // 让 X 轴右侧显示完整
        }),
        legend: getLegend(),
        series: [
          {
            name: '新增商机数量',
            type: 'bar',
            yAxisIndex: 0,
            data: res.map((s: any) => s.businessCreateCount),
          },
          {
            name: '新增商机金额',
            type: 'bar',
            yAxisIndex: 1,
            data: res.map((s: any) => s.totalPrice),
          },
        ],
        toolbox: {
          feature: {
            dataZoom: {
              xAxisIndex: false, // 数据区域缩放：Y 轴不缩放
            },
            brush: {
              type: ['lineX', 'clear'], // 区域缩放按钮、还原按钮
            },
            saveAsImage: { show: true, name: '新增商机分析' }, // 保存为图片
          },
        },
        tooltip: getTooltip(),
        yAxis: [
          {
            type: 'value',
            name: '新增商机数量',
            min: 0,
            minInterval: 1, // 显示整数刻度
          },
          {
            type: 'value',
            name: '新增商机金额',
            min: 0,
            minInterval: 1, // 显示整数刻度
            splitLine: {
              lineStyle: {
                type: 'dotted', // 右侧网格线虚化, 减少混乱
                opacity: 0.7,
              },
            },
          },
        ],
        xAxis: {
          type: 'category',
          name: '日期',
          data: res.map((s: any) => s.time),
        },
      };
    }
    case 'funnel': {
      const list = res.map((item: any) => ({
        value: active
          ? Number(item.businessCount || 0)
          : Number(item.totalPrice || 0),
        name: `${item.statusName}-${item.businessCount || 0}个`,
        statusName: item.statusName,
        statusPercent: item.statusPercent,
        businessCount: item.businessCount,
        totalPrice: item.totalPrice,
      }));
      const maxValue = Math.max(
        ...list.map((item: any) => Number(item.value || 0)),
        1,
      );
      return {
        title: {
          text: '销售漏斗',
        },
        tooltip: getTooltip({
          trigger: 'item',
          axisPointer: undefined,
          formatter: (params: any) => {
            const data = params.data || {};
            return [
              data.statusName || params.name,
              `商机数：${data.businessCount || 0} 个`,
              `商机金额：${erpPriceInputFormatter(data.totalPrice || 0)} 元`,
              `赢单率：${data.statusPercent || 0}%`,
            ].join('<br/>');
          },
        }),
        toolbox: {
          feature: {
            dataView: { readOnly: false },
            restore: {},
            saveAsImage: {},
          },
        },
        legend: getLegend({
          data: list.map((item: any) => item.name),
        }),
        series: [
          {
            name: '销售漏斗',
            type: 'funnel',
            left: '10%',
            top: 60,
            bottom: 60,
            width: '80%',
            min: 0,
            max: maxValue,
            minSize: '0%',
            maxSize: '100%',
            sort: 'none',
            gap: 2,
            label: {
              show: true,
              position: 'inside',
            },
            labelLine: {
              length: 10,
              lineStyle: {
                width: 1,
                type: 'solid',
              },
            },
            itemStyle: {
              borderColor: '#fff',
              borderWidth: 1,
            },
            emphasis: {
              label: {
                fontSize: 20,
              },
            },
            data: list,
          },
        ],
      };
    }
    default: {
      return {};
    }
  }
}
