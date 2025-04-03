import type { PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemSmsTemplateApi {
  /** 短信模板信息 */
  export interface SmsTemplateVO {
    id?: number;
    type?: number;
    status: number;
    code: string;
    name: string;
    content: string;
    remark: string;
    apiTemplateId: string;
    channelId?: number;
    channelCode?: string;
    params?: string[];
    createTime?: Date;
  }

  /** 发送短信请求 */
  export interface SendSmsReqVO {
    mobile: string;
    templateCode: string;
    templateParams: Record<string, any>;
  }
}

/** 查询短信模板列表 */
export function getSmsTemplatePage(params: any) {
  return requestClient.get<PageResult<SystemSmsTemplateApi.SmsTemplateVO>>(
    '/system/sms-template/page',
    { params },
  );
}

/** 查询短信模板详情 */
export function getSmsTemplate(id: number) {
  return requestClient.get<SystemSmsTemplateApi.SmsTemplateVO>(
    `/system/sms-template/get?id=${id}`,
  );
}

/** 新增短信模板 */
export function createSmsTemplate(data: SystemSmsTemplateApi.SmsTemplateVO) {
  return requestClient.post('/system/sms-template/create', data);
}

/** 修改短信模板 */
export function updateSmsTemplate(data: SystemSmsTemplateApi.SmsTemplateVO) {
  return requestClient.put('/system/sms-template/update', data);
}

/** 删除短信模板 */
export function deleteSmsTemplate(id: number) {
  return requestClient.delete(`/system/sms-template/delete?id=${id}`);
}

/** 导出短信模板 */
export function exportSmsTemplate(params: any) {
  return requestClient.download('/system/sms-template/export-excel', {
    params,
  });
}

/** 发送短信 */
export function sendSms(data: SystemSmsTemplateApi.SendSmsReqVO) {
  return requestClient.post('/system/sms-template/send-sms', data);
}
