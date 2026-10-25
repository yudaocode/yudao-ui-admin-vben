import { MapChart } from 'echarts/charts';
import { GeoComponent } from 'echarts/components';

import echarts from './echarts';
// 中国地图数据连同地图组件仅在图表用到地图时由 use-echarts 按需加载
import chinaMap from './map/china.json';

/**
 * 注册地图组件及中国地图
 *
 * 注意：需由 use-echarts 显式调用；包的 sideEffects 只声明了 CSS，仅有顶层副作用的模块会被 tree-shaking 移除
 */
export function registerChinaMap() {
  echarts.use([MapChart, GeoComponent]);

  echarts.registerMap('china', {
    geoJSON: chinaMap as any,
    specialAreas: {
      china: {
        left: 500,
        top: 500,
        width: 1000,
        height: 1000,
      },
    },
  });
}
