import { requestClient } from '#/api/request';

export namespace ImManagerStatisticsApi {
  /** 统计概览 */
  export interface Overview {
    totalUser: number;
    newUserToday: number;
    totalGroup: number;
    newGroupToday: number;
    activeUserDaily: number;
    activeUserWeekly: number;
    activeUserMonthly: number;
    privateMessageToday: number;
    groupMessageToday: number;
    privateMessageYesterday: number;
    groupMessageYesterday: number;
  }

  /** 趋势数据 */
  export interface Trend {
    dates: string[];
    series: Record<string, number[]>;
  }

  /** 消息类型分布 */
  export interface MessageType {
    type: number; // 参见 ImContentTypeEnum 枚举类，由前端按 DICT_TYPE.IM_CONTENT_TYPE 翻译
    value: number;
  }

  /** 群规模分布 */
  export interface GroupSize {
    range: string;
    count: number;
  }

  /** 消息发送排行 */
  export interface TopSender {
    userId: number;
    nickname: string;
    messageCount: number;
  }
}


/** 获得 KPI 概览 */
export function getStatisticsOverview() {
  return requestClient.get<ImManagerStatisticsApi.Overview>(
    '/im/manager/statistics/overview',
  );
}

/** 获得消息趋势（私聊 + 群聊双线） */
export function getMessageTrend(days: number) {
  return requestClient.get<ImManagerStatisticsApi.Trend>(
    '/im/manager/statistics/message-trend',
    { params: { days } },
  );
}

/** 获得用户趋势（新增注册 + 日活双线） */
export function getUserTrend(days: number) {
  return requestClient.get<ImManagerStatisticsApi.Trend>(
    '/im/manager/statistics/user-trend',
    { params: { days } },
  );
}

/** 获得内容类型分布（最近 30 天） */
export function getMessageTypeDistribution() {
  return requestClient.get<ImManagerStatisticsApi.MessageType[]>(
    '/im/manager/statistics/message-type-distribution',
  );
}

/** 获得群规模分布 */
export function getGroupSizeDistribution() {
  return requestClient.get<ImManagerStatisticsApi.GroupSize[]>(
    '/im/manager/statistics/group-size-distribution',
  );
}

/** 获得消息 TOP 发送者（最近 30 天） */
export function getTopSenders() {
  return requestClient.get<ImManagerStatisticsApi.TopSender[]>(
    '/im/manager/statistics/top-senders',
  );
}
