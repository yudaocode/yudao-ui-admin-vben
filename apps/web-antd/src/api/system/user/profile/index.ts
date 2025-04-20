import { requestClient } from '#/api/request';

export namespace SystemUserProfileApi {
  /** 社交用户信息 */
  export interface SocialUser {
    type: number;
    openid: string;
  }

  /** 用户个人中心信息 */
  export interface UserProfileRespVO {
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
    socialUsers: SocialUser[];
  }

  /** 更新密码请求 */
  export interface UpdatePasswordReqVO {
    oldPassword: string;
    newPassword: string;
  }

  /** 更新个人信息请求 */
  export interface UpdateProfileReqVO {
    nickname: string;
    email?: string;
    mobile?: string;
    sex?: number;
  }
}

/** 获取登录用户信息 */
export function getUserProfile() {
  return requestClient.get<SystemUserProfileApi.UserProfileRespVO>('/system/user/profile/get');
}

/** 修改用户个人信息 */
export function updateUserProfile(data: SystemUserProfileApi.UpdateProfileReqVO) {
  return requestClient.put('/system/user/profile/update', data);
}

/** 修改用户个人密码 */
export function updateUserPassword(data: SystemUserProfileApi.UpdatePasswordReqVO) {
  return requestClient.put('/system/user/profile/update-password', data);
}

/** 上传用户个人头像 */
export function updateUserAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatarFile', file);
  return requestClient.put('/system/user/profile/update-avatar', formData);
}
