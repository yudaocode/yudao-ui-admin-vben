import { requestClient } from '#/api/request';

export namespace OaMailProviderApi {
  /** 邮箱连接配置 */
  export interface MailConnectionConfig {
    host: string; // 服务器域名
    port: number; // 服务器端口
    sslEnable: boolean; // 是否开启 SSL
    starttlsEnable: boolean; // 是否开启 STARTTLS
  }

  /** OA 邮箱服务配置 */
  export interface MailProvider {
    id?: number; // 服务配置编号
    name: string; // 名称
    imap: MailConnectionConfig; // 收信连接
    smtp: MailConnectionConfig; // 发信连接
    status: number; // 状态
  }
}

/** 查询服务配置精简列表 */
export function getSimpleMailProviderList() {
  return requestClient.get<OaMailProviderApi.MailProvider[]>(
    '/oa/mail-provider/simple-list',
  );
}

/** 查询服务配置列表 */
export function getMailProviderList(status?: number) {
  return requestClient.get<OaMailProviderApi.MailProvider[]>(
    '/oa/mail-provider/list',
    { params: { status } },
  );
}

/** 查询服务配置 */
export function getMailProvider(id: number) {
  return requestClient.get<OaMailProviderApi.MailProvider>(
    '/oa/mail-provider/get',
    { params: { id } },
  );
}

/** 新增服务配置 */
export function createMailProvider(
  data: Partial<OaMailProviderApi.MailProvider>,
) {
  return requestClient.post<number>('/oa/mail-provider/create', data);
}

/** 修改服务配置 */
export function updateMailProvider(
  data: Partial<OaMailProviderApi.MailProvider>,
) {
  return requestClient.put<boolean>('/oa/mail-provider/update', data);
}

/** 删除服务配置 */
export function deleteMailProvider(id: number) {
  return requestClient.delete<boolean>('/oa/mail-provider/delete', {
    params: { id },
  });
}
