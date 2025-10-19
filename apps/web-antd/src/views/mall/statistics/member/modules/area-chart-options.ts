import type { EChartsOption } from 'echarts';
import type { MallMemberStatisticsApi } from '#/api/mall/statistics/member';

import { fenToYuan } from '@vben/utils';

// 地图数据由 @vben/plugins/echarts 自动处理

/** 会员地域分布图表配置 */
export function getAreaChartOptions(data: MallMemberStatisticsApi.AreaStatistics[]): EChartsOption {
  let min = 0;
  let max = 0;
  
  const mapData = data.map((item) => {
    min = Math.min(min, item.orderPayUserCount || 0);
    max = Math.max(max, item.orderPayUserCount || 0);
    return {
      ...item,
      name: item.areaName,
      value: item.orderPayUserCount || 0,
    };
  });

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params?.data;
        if (!data) return params?.name || '';
        
        return `${data.areaName || params.name}<br/>
会员数量：${data.userCount || 0}<br/>
订单创建数量：${data.orderCreateUserCount || 0}<br/>
订单支付数量：${data.orderPayUserCount || 0}<br/>
订单支付金额：￥${Number(fenToYuan(data.orderPayPrice || 0)).toFixed(2)}`;
      },
    },
    visualMap: {
      text: ['高', '低'],
      realtime: false,
      calculable: true,
      top: 'middle',
      min,
      max,
      inRange: {
        color: ['#fff', '#3b82f6'],
      },
    },
    series: [
      {
        name: '会员地域分布',
        type: 'map',
        map: 'china',
        roam: false,
        selectedMode: false,
        data: mapData,
      },
    ],
  };
}

// 地图数据已在 @vben/plugins/echarts 中自动注册
