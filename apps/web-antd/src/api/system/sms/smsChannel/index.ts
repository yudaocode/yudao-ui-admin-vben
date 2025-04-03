import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemSmsChannelApi {
  /** 短信渠道信息 */
  export interface SmsChannelVO {
    id?: number;
    code: string;
    status: number;
    signature: string;
    remark: string;
    apiKey: string;
    apiSecret: string;
    callbackUrl: string;
    createTime?: Date;
  }
}

/** 查询短信渠道列表 */
export function getSmsChannelPage(params: PageParam) {
  return requestClient.get<{
    list: SystemSmsChannelApi.SmsChannelVO[];
    total: number;
  }>('/system/sms-channel/page', { params });
}

/** 获得短信渠道精简列表 */
export function getSimpleSmsChannelList() {
  return requestClient.get<SystemSmsChannelApi.SmsChannelVO[]>(
    '/system/sms-channel/simple-list',
  );
}

/** 查询短信渠道详情 */
export function getSmsChannel(id: number) {
  return requestClient.get<SystemSmsChannelApi.SmsChannelVO>(
    `/system/sms-channel/get?id=${id}`,
  );
}

/** 新增短信渠道 */
export function createSmsChannel(data: SystemSmsChannelApi.SmsChannelVO) {
  return requestClient.post('/system/sms-channel/create', data);
}

/** 修改短信渠道 */
export function updateSmsChannel(data: SystemSmsChannelApi.SmsChannelVO) {
  return requestClient.put('/system/sms-channel/update', data);
}

/** 删除短信渠道 */
export function deleteSmsChannel(id: number) {
  return requestClient.delete(`/system/sms-channel/delete?id=${id}`);
}

/** 导出短信渠道 */
export function exportSmsChannel(params: SystemSmsChannelApi.SmsChannelVO) {
  return requestClient.download('/system/sms-channel/export', { params });
}
