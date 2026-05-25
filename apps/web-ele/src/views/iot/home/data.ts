import type { IotStatisticsApi } from '#/api/iot/statistics';

/** 统计数据 */
export type StatsData = IotStatisticsApi.StatisticsSummaryRespVO;

/** 默认统计数据；用 -1 作为「未加载」哨兵，避免与「真 0 设备」混淆 */
export const defaultStatsData: StatsData = {
  productCategoryCount: -1,
  productCount: -1,
  deviceCount: -1,
  deviceMessageCount: -1,
  productCategoryTodayCount: -1,
  productTodayCount: -1,
  deviceTodayCount: -1,
  deviceMessageTodayCount: -1,
  deviceOnlineCount: -1,
  deviceOfflineCount: -1,
  deviceInactiveCount: -1,
  productCategoryDeviceCounts: {},
};
