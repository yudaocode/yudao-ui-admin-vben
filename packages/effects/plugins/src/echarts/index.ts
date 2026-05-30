export { default as EchartsUI } from './echarts-ui.vue';
export type { ECOption } from './types';
export * from './use-echarts';

// add by 芋艿：额外透出 echarts 原生 EChartsOption 类型，方便业务模块（如 mes/home 图表配置）声明 option 返回值类型，避免业务侧直接依赖 echarts 包（apps 未把 echarts 列为直接依赖）
export type { EChartsOption } from 'echarts';
