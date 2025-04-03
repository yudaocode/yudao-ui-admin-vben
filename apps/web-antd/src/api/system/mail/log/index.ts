import type { PageParam } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailLogApi {
  export interface MailLogVO {
    id: number;
    userId: number;
    userType: number;
    toMail: string;
    accountId: number;
    fromMail: string;
    templateId: number;
    templateCode: string;
    templateNickname: string;
    templateTitle: string;
    templateContent: string;
    templateParams: string;
    sendStatus: number;
    sendTime: Date;
    sendMessageId: string;
    sendException: string;
    createTime: Date;
  }
}

// 查询邮件日志列表
export const getMailLogPage = async (params: PageParam) => {
  return await requestClient.get<{
    list: SystemMailLogApi.MailLogVO[];
    total: number;
  }>('/system/mail-log/page', { params });
};

// 查询邮件日志详情
export const getMailLog = async (id: number) => {
  return await requestClient.get<SystemMailLogApi.MailLogVO>(
    '/system/mail-log/get',
    {
      params: { id },
    },
  );
};

// 重新发送邮件
export const resendMail = async (id: number) => {
  return await requestClient.put<boolean>('/system/mail-log/resend', null, {
    params: { id },
  });
};

// 批量删除邮件日志
export const deleteMailLogs = async (ids: number[]) => {
  return await requestClient.delete<boolean>('/system/mail-log/delete', {
    data: { ids },
  });
};
