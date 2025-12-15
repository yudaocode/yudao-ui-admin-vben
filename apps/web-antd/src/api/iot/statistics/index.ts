import { requestClient } from '#/api/request';

export namespace IotStatisticsApi {
  /** 统计摘要数据 */
  export interface StatisticsSummaryRespVO {
    productCategoryCount: number; // 品类数量
    productCount: number; // 产品数量
    deviceCount: number; // 设备数量
    deviceMessageCount: number; // 上报数量
    productCategoryTodayCount: number; // 今日新增品类数量
    productTodayCount: number; // 今日新增产品数量
    deviceTodayCount: number; // 今日新增设备数量
    deviceMessageTodayCount: number; // 今日新增上报数量
    deviceOnlineCount: number; // 在线数量
    deviceOfflineCount: number; // 离线数量
    deviceInactiveCount: number; // 待激活设备数量
    productCategoryDeviceCounts: Record<string, number>; // 按品类统计的设备数量
  }

  /** 时间戳-数值的键值对类型 */
  export interface TimeValueItem {
    [key: string]: number;
  }

  /** 消息统计数据类型 */
  export interface DeviceMessageSummary {
    statType: number;
    upstreamCounts: TimeValueItem[];
    downstreamCounts: TimeValueItem[];
  }

  /** 设备消息数量统计（按日期） */
  export interface DeviceMessageSummaryByDateRespVO {
    time: string; // 时间轴
    upstreamCount: number; // 上行消息数量
    downstreamCount: number; // 下行消息数量
  }

  /** 设备消息统计请求 */
  export interface DeviceMessageReqVO {
    interval: number;
    times?: string[];
  }
}

/** 获取 IoT 统计摘要数据 */
export function getStatisticsSummary() {
  return requestClient.get<IotStatisticsApi.StatisticsSummaryRespVO>(
    '/iot/statistics/get-summary',
  );
}

/** 获取设备消息的数据统计（按日期） */
export function getDeviceMessageSummaryByDate(
  params: IotStatisticsApi.DeviceMessageReqVO,
) {
  return requestClient.get<IotStatisticsApi.DeviceMessageSummaryByDateRespVO[]>(
    '/iot/statistics/get-device-message-summary-by-date',
    { params },
  );
}
