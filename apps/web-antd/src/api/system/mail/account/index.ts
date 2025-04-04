import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailAccountApi {
  /** 邮箱账号 */
  export interface SystemMailAccount {
    id: number;
    mail: string;
    username: string;
    password: string;
    host: string;
    port: number;
    sslEnable: boolean;
    starttlsEnable: boolean;
    status: number;
    createTime: Date;
    remark: string;
  }
}
// TODO @puhui999：改成 function 风格；不用 await
/** 查询邮箱账号列表 */
export const getMailAccountPage = async (params: PageParam) => {
  return await requestClient.get<PageResult<SystemMailAccountApi.SystemMailAccount>>(
    '/system/mail-account/page',
    { params },
  );
};

/** 查询邮箱账号详情 */
export const getMailAccount = async (id: number) => {
  return await requestClient.get<SystemMailAccountApi.SystemMailAccount>(`/system/mail-account/get?id=${id}`);
};

/** 新增邮箱账号 */
export const createMailAccount = async (data: SystemMailAccountApi.SystemMailAccount) => {
  return await requestClient.post<SystemMailAccountApi.SystemMailAccount>('/system/mail-account/create', data);
};

/** 修改邮箱账号 */
export const updateMailAccount = async (data: SystemMailAccountApi.SystemMailAccount) => {
  return await requestClient.put<SystemMailAccountApi.SystemMailAccount>('/system/mail-account/update', data);
};

/** 删除邮箱账号 */
export const deleteMailAccount = async (id: number) => {
  return await requestClient.delete<boolean>(`/system/mail-account/delete?id=${id}`);
};

/** 获得邮箱账号精简列表 */
export const getSimpleMailAccountList = async () => {
  return await requestClient.get<SystemMailAccountApi.SystemMailAccount[]>('/system/mail-account/simple-list');
};
