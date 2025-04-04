import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace SystemMailAccountApi {
  /** 邮箱信息 */
  export interface MailAccount {
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

/** 查询邮箱账号列表 */
export const getMailAccountPage = async (params: PageParam) => {
  return await requestClient.get<PageResult<SystemMailAccountApi.MailAccount>>(
    '/system/mail-account/page',
    { params },
  );
};

/** 查询邮箱账号详情 */
export const getMailAccount = async (id: number) => {
  return await requestClient.get<SystemMailAccountApi.MailAccount>(
    '/system/mail-account/get',
    {
      params: { id },
    },
  );
};

/** 新增邮箱账号 */
export const createMailAccount = async (
  data: SystemMailAccountApi.MailAccount,
) => {
  return await requestClient.post<SystemMailAccountApi.MailAccount>(
    '/system/mail-account/create',
    data,
  );
};

/** 修改邮箱账号 */
export const updateMailAccount = async (
  data: SystemMailAccountApi.MailAccount,
) => {
  return await requestClient.put<SystemMailAccountApi.MailAccount>(
    '/system/mail-account/update',
    data,
  );
};

/** 删除邮箱账号 */
export const deleteMailAccount = async (id: number) => {
  return await requestClient.delete<boolean>('/system/mail-account/delete', {
    params: { id },
  });
};

/** 获得邮箱账号精简列表 */
export const getSimpleMailAccountList = async () => {
  return await requestClient.get<SystemMailAccountApi.MailAccount[]>(
    '/system/mail-account/simple-list',
  );
};

/** 测试邮箱连接 */
export const testMailAccount = async (id: number) => {
  return await requestClient.post<boolean>('/system/mail-account/test', null, {
    params: { id },
  });
};
