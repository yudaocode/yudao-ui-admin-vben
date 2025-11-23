/**
 * IoT 首页数据配置文件
 *
 * 该文件只包含统计数据接口定义
 */

import type { IotStatisticsApi } from '#/api/iot/statistics';

/** 统计数据接口 - 使用 API 定义的类型 */
export type StatsData = IotStatisticsApi.StatisticsSummary;

/** 默认统计数据 */
export const defaultStatsData: StatsData = {
  productCategoryCount: 0,
  productCount: 0,
  deviceCount: 0,
  deviceMessageCount: 0,
  productCategoryTodayCount: 0,
  productTodayCount: 0,
  deviceTodayCount: 0,
  deviceMessageTodayCount: 0,
  deviceOnlineCount: 0,
  deviceOfflineCount: 0,
  deviceInactiveCount: 0,
  productCategoryDeviceCounts: {},
};
