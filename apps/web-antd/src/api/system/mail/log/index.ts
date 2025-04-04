import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailLogApi {
  /** 邮件日志 */
  export interface MailLog {
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
    sendTime: string;
    sendMessageId: string;
    sendException: string;
    createTime: string;
  }
}

/** 查询邮件日志列表 */
export const getMailLogPage = async (params: PageParam) => {
  return await requestClient.get<PageResult<SystemMailLogApi.MailLog>>(
    '/system/mail-log/page',
    { params },
  );
};

/** 查询邮件日志详情 */
export const getMailLog = async (id: number) => {
  return await requestClient.get<SystemMailLogApi.MailLog>(
    '/system/mail-log/get',
    {
      params: { id },
    },
  );
};

/** 重新发送邮件 */
export const resendMail = async (id: number) => {
  return await requestClient.put<boolean>('/system/mail-log/resend', null, {
    params: { id },
  });
};

/** 批量删除邮件日志 */
export const deleteMailLogs = async (ids: number[]) => {
  return await requestClient.delete<boolean>('/system/mail-log/delete', {
    data: { ids },
  });
};
