import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemSmsLogApi {
  /** 短信日志信息 */
  export interface SmsLogVO {
    id: null | number;
    channelId: null | number;
    channelCode: string;
    templateId: null | number;
    templateCode: string;
    templateType: null | number;
    templateContent: string;
    templateParams: null | Record<string, any>;
    apiTemplateId: string;
    mobile: string;
    userId: null | number;
    userType: null | number;
    sendStatus: null | number;
    sendTime: Date | null;
    apiSendCode: string;
    apiSendMsg: string;
    apiRequestId: string;
    apiSerialNo: string;
    receiveStatus: null | number;
    receiveTime: Date | null;
    apiReceiveCode: string;
    apiReceiveMsg: string;
    createTime: Date | null;
  }
}

/** 查询短信日志列表 */
export function getSmsLogPage(params: PageParam) {
  return requestClient.get<{
    list: SystemSmsLogApi.SmsLogVO[];
    total: number;
  }>('/system/sms-log/page', { params });
}

/** 导出短信日志 */
export function exportSmsLog(params: SystemSmsLogApi.SmsLogVO) {
  return requestClient.download('/system/sms-log/export-excel', { params });
}
