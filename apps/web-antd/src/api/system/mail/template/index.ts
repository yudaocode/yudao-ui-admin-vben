import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailTemplateApi {
  /** 邮件模版信息 */
  export interface MailTemplate {
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
  export interface MailSendReq {
    mail: string;
    templateCode: string;
    templateParams: Record<string, any>;
  }
}

/** 查询邮件模版列表 */
export const getMailTemplatePage = async (params: PageParam) => {
  return await requestClient.get<
    PageResult<SystemMailTemplateApi.MailTemplate>
  >('/system/mail-template/page', { params });
};

/** 查询邮件模版详情 */
export const getMailTemplate = async (id: number) => {
  return await requestClient.get<SystemMailTemplateApi.MailTemplate>(
    '/system/mail-template/get',
    {
      params: { id },
    },
  );
};

/** 新增邮件模版 */
export const createMailTemplate = async (
  data: SystemMailTemplateApi.MailTemplate,
) => {
  return await requestClient.post<SystemMailTemplateApi.MailTemplate>(
    '/system/mail-template/create',
    data,
  );
};

/** 修改邮件模版 */
export const updateMailTemplate = async (
  data: SystemMailTemplateApi.MailTemplate,
) => {
  return await requestClient.put<SystemMailTemplateApi.MailTemplate>(
    '/system/mail-template/update',
    data,
  );
};

/** 删除邮件模版 */
export const deleteMailTemplate = async (id: number) => {
  return await requestClient.delete<boolean>('/system/mail-template/delete', {
    params: { id },
  });
};

/** 发送邮件 */
export const sendMail = async (data: SystemMailTemplateApi.MailSendReq) => {
  return await requestClient.post<boolean>(
    '/system/mail-template/send-mail',
    data,
  );
};
