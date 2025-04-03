import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailTemplateApi {
  export interface MailTemplateVO {
    id: number;
    name: string;
    code: string;
    accountId: number;
    nickname: string;
    title: string;
    content: string;
    params: string;
    status: number;
    remark: string;
    createTime: Date;
  }

  export interface MailSendReqVO {
    mail: string;
    templateCode: string;
    templateParams: Record<string, any>;
  }
}

// 查询邮件模版列表
export const getMailTemplatePage = async (params: PageParam) => {
  return await requestClient.get<{
    list: SystemMailTemplateApi.MailTemplateVO[];
    total: number;
  }>('/system/mail-template/page', { params });
};

// 查询邮件模版详情
export const getMailTemplate = async (id: number) => {
  return await requestClient.get<SystemMailTemplateApi.MailTemplateVO>(
    '/system/mail-template/get',
    {
      params: { id },
    },
  );
};

// 新增邮件模版
export const createMailTemplate = async (
  data: SystemMailTemplateApi.MailTemplateVO,
) => {
  return await requestClient.post<SystemMailTemplateApi.MailTemplateVO>(
    '/system/mail-template/create',
    data,
  );
};

// 修改邮件模版
export const updateMailTemplate = async (
  data: SystemMailTemplateApi.MailTemplateVO,
) => {
  return await requestClient.put<SystemMailTemplateApi.MailTemplateVO>(
    '/system/mail-template/update',
    data,
  );
};

// 删除邮件模版
export const deleteMailTemplate = async (id: number) => {
  return await requestClient.delete<boolean>('/system/mail-template/delete', {
    params: { id },
  });
};

// 发送邮件
export const sendMail = async (data: SystemMailTemplateApi.MailSendReqVO) => {
  return await requestClient.post<boolean>(
    '/system/mail-template/send-mail',
    data,
  );
};
