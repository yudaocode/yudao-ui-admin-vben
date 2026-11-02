import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiRequestLogApi {
  /** AI 请求日志 */
  export interface RequestLog {
    id: number; // 编号
    requestId: string; // 请求编号（服务端生成的 UUID）
    userId: number; // 用户编号
    userNickname?: null | string; // 用户昵称，用户不存在时为空
    bizType: number; // 业务类型，参见 ai_request_log_biz_type 字典
    bizId?: null | number; // 业务编号
    platform: string; // 模型平台
    modelId?: null | number; // 模型编号
    model: string; // 模型标识
    status: number; // 状态，参见 ai_request_log_status 字典
    errorMessage?: null | string; // 错误信息
    beginTime: number; // 开始时间
    endTime?: null | number; // 结束时间
    duration?: null | number; // 耗时（毫秒）
    inputTokens?: null | number; // 输入 Token，未知为 null
    outputTokens?: null | number; // 输出 Token，未知为 null
    totalTokens?: null | number; // 合计 Token，未知为 null
    responseMetadata?: null | Record<string, any>; // 响应元数据
    createTime: number; // 创建时间
  }

  /** AI 请求日志统计 */
  export interface RequestLogStatistics {
    requestCount: number; // 请求总数
    successCount: number; // 成功数
    failCount: number; // 失败数
    cancelCount: number; // 取消数
    inputTokens?: null | number; // 已知输入 Token 合计
    outputTokens?: null | number; // 已知输出 Token 合计
    totalTokens?: null | number; // 完整用量的合计 Token
    knownUsageCount: number; // 完整用量条数
    unknownUsageCount: number; // 用量未知条数
  }
}

/** 查询请求日志分页 */
export function getRequestLogPage(params: PageParam) {
  return requestClient.get<PageResult<AiRequestLogApi.RequestLog>>(
    '/ai/request-log/page',
    { params },
  );
}

/** 查询请求日志详情 */
export function getRequestLog(id: number) {
  return requestClient.get<AiRequestLogApi.RequestLog>(
    `/ai/request-log/get?id=${id}`,
  );
}

/** 查询请求日志统计 */
export function getRequestLogStatistics(params: any) {
  return requestClient.get<AiRequestLogApi.RequestLogStatistics>(
    '/ai/request-log/statistics',
    { params },
  );
}
