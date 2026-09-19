import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaMailMessageApi {
  /** OA 邮件 */
  export interface MailMessage {
    id?: number; // 邮件索引编号
    accountId: number; // 邮箱账号编号
    subject: string; // 主题
    sender?: string; // 发件人
    recipients: string[]; // 收件人
    ccs: string[]; // 抄送人
    receiveTime?: string; // 接收时间
    readStatus?: boolean; // 是否已读
    hasAttach?: boolean; // 是否有附件
    content?: string; // 安全 HTML 正文
    replyTos?: string[]; // 回复地址
    attachments?: { name: string; part: string; size: number }[]; // 附件
    attachmentParts?: string[]; // 保留的原附件路径
    draftId?: number; // 原草稿编号
    sourceId?: number; // 原邮件编号
    mode?: string; // 写信方式
  }
}

/** 全量同步远端邮件索引，不受列表分页条件影响 */
export function syncMailMessageList(accountId: number) {
  return requestClient.post<number>('/oa/mail-message/sync', null, {
    params: { accountId },
    timeout: 300_000,
  });
}

/** 获得邮件分页 */
export function getMailMessagePage(params: PageParam) {
  return requestClient.get<PageResult<OaMailMessageApi.MailMessage>>(
    '/oa/mail-message/page',
    { params },
  );
}

/** 获得邮件详情 */
export function getMailMessage(id: number) {
  return requestClient.get<OaMailMessageApi.MailMessage>(
    '/oa/mail-message/get',
    { params: { id }, timeout: 60_000 },
  );
}

/** 修改已读状态 */
export function updateMailMessageRead(id: number, readStatus: boolean) {
  return requestClient.put<boolean>('/oa/mail-message/update-read', null, {
    params: { id, readStatus },
    timeout: 60_000,
  });
}

/** 恢复已删除邮件到收件箱 */
export function restoreMailMessage(id: number) {
  return requestClient.put<boolean>('/oa/mail-message/restore', null, {
    params: { id },
    timeout: 60_000,
  });
}

/** 删除邮件 */
export function deleteMailMessage(id: number) {
  return requestClient.delete<boolean>('/oa/mail-message/delete', {
    params: { id },
    timeout: 60_000,
  });
}

/** 保存草稿 */
export function saveMailMessageDraft(data: FormData) {
  return requestClient.post<number>('/oa/mail-message/save-draft', data, {
    timeout: 120_000,
  });
}

/** 发送邮件，不自动重试 */
export function sendMailMessage(data: FormData) {
  return requestClient.post<string>('/oa/mail-message/send', data, {
    timeout: 120_000,
  });
}

/** 获得写信预填数据 */
export function getMailMessageCompose(id: number, mode: string) {
  return requestClient.get<OaMailMessageApi.MailMessage>(
    '/oa/mail-message/compose',
    { params: { id, mode }, timeout: 60_000 },
  );
}

/** 下载本人邮件附件 */
export function downloadMailMessageAttachment(id: number, part: string) {
  return requestClient.download('/oa/mail-message/attachment', {
    params: { id, part },
    timeout: 60_000,
  });
}
