import { requestClient } from '#/api/request';

export namespace SystemUserProfileApi {
  /** 用户个人中心信息 */
  export interface UserProfileResp {
    id: number;
    username: string;
    nickname: string;
    email?: string;
    mobile?: string;
    sex?: number;
    avatar?: string;
    loginIp: string;
    loginDate: string;
    createTime: string;
    roles: any[];
    dept: any;
    posts: any[];
  }

  /** 更新密码请求 */
  export interface UpdatePasswordReq {
    oldPassword: string;
    newPassword: string;
  }

  /** 更新个人信息请求 */
  export interface UpdateProfileReq {
    nickname?: string;
    email?: string;
    mobile?: string;
    sex?: number;
    avatar?: string;
  }
}

/** 获取登录用户信息 */
export function getUserProfile() {
  return requestClient.get<SystemUserProfileApi.UserProfileResp>(
    '/system/user/profile/get',
  );
}

/** 修改用户个人信息 */
export function updateUserProfile(data: SystemUserProfileApi.UpdateProfileReq) {
  return requestClient.put('/system/user/profile/update', data);
}

/** 修改用户个人密码 */
export function updateUserPassword(
  data: SystemUserProfileApi.UpdatePasswordReq,
) {
  return requestClient.put('/system/user/profile/update-password', data);
}
