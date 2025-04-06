import { requestClient } from '#/api/request';
import type { PageParam, PageResult } from '@vben/request';

export namespace SystemSocialUserApi {
  /** 社交用户信息 */
  export interface SystemSocialUser {
    id?: number;
    type: number;
    openid: string;
    token: string;
    rawTokenInfo: string;
    nickname: string;
    avatar: string;
    rawUserInfo: string;
    code: string;
    state: string;
    createTime?: Date;
    updateTime?: Date;
  }
}

/** 查询社交用户列表 */
export function getSocialUserPage(params: PageParam) {
  return requestClient.get<PageResult<SystemSocialUserApi.SystemSocialUser>>('/system/social-user/page',
    { params }
  );
}

/** 查询社交用户详情 */
export function getSocialUser(id: number) {
  return requestClient.get<SystemSocialUserApi.SystemSocialUser>(`/system/social-user/get?id=${id}`);
}
