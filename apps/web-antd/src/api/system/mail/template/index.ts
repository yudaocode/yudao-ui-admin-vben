import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailTemplateApi {
  /** 邮件模版信息 */
  export interface SystemMailTemplate {
    id: number;
    name: string;
    code: string;
    accountId: number;
    nickname: string;
    title: string;
    content: string;
    params: string[];
    status: number;
    remark: string;
    createTime: Date;
  }

  /** 邮件发送信息 */
  export interface MailSendReqVO {
    mail: string;
    templateCode: string;
    templateParams: Record<string, any>;
  }
}
// TODO @puhui999：改成 function 风格；不用 await
/** 查询邮件模版列表 */
export const getMailTemplatePage = async (params: PageParam) => {
  return await requestClient.get<PageResult<SystemMailTemplateApi.SystemMailTemplate>>(
    '/system/mail-template/page',
    { params }
  );
};

/** 查询邮件模版详情 */
export const getMailTemplate = async (id: number) => {
  return await requestClient.get<SystemMailTemplateApi.SystemMailTemplate>(`/system/mail-template/get?id=${id}`);
};

/** 新增邮件模版 */
export const createMailTemplate = async (data: SystemMailTemplateApi.SystemMailTemplate) => {
  return await requestClient.post<SystemMailTemplateApi.SystemMailTemplate>('/system/mail-template/create', data);
};

/** 修改邮件模版 */
export const updateMailTemplate = async (data: SystemMailTemplateApi.SystemMailTemplate) => {
  return await requestClient.put<SystemMailTemplateApi.SystemMailTemplate>('/system/mail-template/update', data);
};

/** 删除邮件模版 */
export const deleteMailTemplate = async (id: number) => {
  return await requestClient.delete<boolean>(`/system/mail-template/delete?id=${id}`);
};

/** 发送邮件 */
export const sendMail = async (data: SystemMailTemplateApi.MailSendReqVO) => {
  return await requestClient.post<boolean>('/system/mail-template/send-mail', data);
};
