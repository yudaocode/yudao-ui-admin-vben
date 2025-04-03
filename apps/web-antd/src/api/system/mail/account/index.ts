import type { PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

// TODO @puhui999：代码风格的统一
export namespace SystemMailAccountApi {
  export interface MailAccountVO {
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

// 查询邮箱账号列表
export const getMailAccountPage = async (params: any) => {
  return await requestClient.get<
    PageResult<SystemMailAccountApi.MailAccountVO>
  >('/system/mail-account/page', { params });
};

// 查询邮箱账号详情
export const getMailAccount = async (id: number) => {
  return await requestClient.get<SystemMailAccountApi.MailAccountVO>(
    '/system/mail-account/get',
    {
      params: { id },
    },
  );
};

// 新增邮箱账号
export const createMailAccount = async (
  data: SystemMailAccountApi.MailAccountVO,
) => {
  return await requestClient.post<SystemMailAccountApi.MailAccountVO>(
    '/system/mail-account/create',
    data,
  );
};

// 修改邮箱账号
export const updateMailAccount = async (
  data: SystemMailAccountApi.MailAccountVO,
) => {
  return await requestClient.put<SystemMailAccountApi.MailAccountVO>(
    '/system/mail-account/update',
    data,
  );
};

// 删除邮箱账号
export const deleteMailAccount = async (id: number) => {
  return await requestClient.delete<boolean>('/system/mail-account/delete', {
    params: { id },
  });
};

// 获得邮箱账号精简列表
export const getSimpleMailAccountList = async () => {
  return await requestClient.get<SystemMailAccountApi.MailAccountVO[]>(
    '/system/mail-account/simple-list',
  );
};

// 测试邮箱连接
export const testMailAccount = async (id: number) => {
  return await requestClient.post<boolean>('/system/mail-account/test', null, {
    params: { id },
  });
};
