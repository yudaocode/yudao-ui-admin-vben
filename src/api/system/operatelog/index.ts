import { defHttp } from "@/utils/http/axios";

export interface OperateLogVO {
  id: number;
  traceId: string;
  userType: number;
  userId: number;
  userName: string;
  type: string;
  subType: string;
  bizId: number;
  action: string;
  extra: string;
  requestMethod: string;
  requestUrl: string;
  userIp: string;
  creator: string;
  creatorName: string;
  createTime: Date;
}

export interface OperateLogPageReqVO extends PageParam {
  module?: string;
  userNickname?: string;
  type?: number;
  success?: boolean;
  startTime?: Date[];
}

// 查询操作日志列表
export function getOperateLogPage(params: OperateLogPageReqVO) {
  return defHttp.get({ url: "/system/operate-log/page", params });
}
// 导出操作日志
export function exportOperateLog(params: OperateLogPageReqVO) {
  return defHttp.download({ url: "/system/operate-log/export", params }, "操作日志.xls");
}
