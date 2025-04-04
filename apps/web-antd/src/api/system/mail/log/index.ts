import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailLogApi {
  /** 邮件日志 */
  export interface SystemMailLog {
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
// TODO @puhui999：改成 function 风格；不用 await
/** 查询邮件日志列表 */
export const getMailLogPage = async (params: PageParam) => {
  return await requestClient.get<PageResult<SystemMailLogApi.SystemMailLog>>(
    '/system/mail-log/page',
    { params }
  );
};

/** 查询邮件日志详情 */
export const getMailLog = async (id: number) => {
  return await requestClient.get<SystemMailLogApi.SystemMailLog>(`/system/mail-log/get?${id}`);
};

/** 重新发送邮件 */
export const resendMail = async (id: number) => {
  return await requestClient.put<boolean>(`/system/mail-log/resend?id=${id}`);
};
