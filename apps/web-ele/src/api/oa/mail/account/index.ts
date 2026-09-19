import { requestClient } from '#/api/request';

export namespace OaMailAccountApi {
  /** OA 邮箱账号 */
  export interface MailAccount {
    id?: number; // 账号编号
    providerId: number | undefined; // 服务配置编号
    mail: string; // 邮箱地址
    userName?: string; // 归属人姓名
    username: string; // 登录用户名
    password?: string; // 密码或授权码，修改时留空表示不变
    defaultStatus: boolean; // 是否默认发件账号
    status: number; // 状态
  }

  /** 邮箱连接测试结果 */
  export interface MailConnectionResult {
    imap: boolean; // IMAP 是否连接成功
    smtp: boolean; // SMTP 是否连接成功
  }
}

/** 查询当前租户启用邮箱及归属人姓名 */
export function getSimpleMailAccountList() {
  return requestClient.get<OaMailAccountApi.MailAccount[]>(
    '/oa/mail-account/simple-list',
  );
}

/** 查询本人账号列表 */
export function getMailAccountList(status?: number) {
  return requestClient.get<OaMailAccountApi.MailAccount[]>(
    '/oa/mail-account/list',
    { params: { status } },
  );
}

/** 查询本人账号 */
export function getMailAccount(id: number) {
  return requestClient.get<OaMailAccountApi.MailAccount>(
    '/oa/mail-account/get',
    { params: { id } },
  );
}

/** 绑定本人账号 */
export function createMailAccount(data: Partial<OaMailAccountApi.MailAccount>) {
  return requestClient.post<number>('/oa/mail-account/create', data);
}

/** 修改本人账号 */
export function updateMailAccount(data: Partial<OaMailAccountApi.MailAccount>) {
  return requestClient.put<boolean>('/oa/mail-account/update', data);
}

/** 设置默认账号 */
export function updateMailAccountDefault(id: number) {
  return requestClient.put<boolean>('/oa/mail-account/update-default', null, {
    params: { id },
  });
}

/** 移除绑定 */
export function deleteMailAccount(id: number) {
  return requestClient.delete<boolean>('/oa/mail-account/delete', {
    params: { id },
  });
}

/** 测试连接，不发送邮件 */
export function testMailAccountConnection(id: number) {
  return requestClient.post<OaMailAccountApi.MailConnectionResult>(
    '/oa/mail-account/test-connection',
    null,
    { params: { id }, timeout: 60_000 },
  );
}
