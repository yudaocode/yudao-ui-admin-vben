import { ContentTypeEnum } from '@/enums/httpEnum'
import { defHttp } from '@/utils/http/axios'

export interface ProfileDept {
  id: number
  name: string
}
export interface ProfileRole {
  id: number
  name: string
}
export interface ProfilePost {
  id: number
  name: string
}
export interface SocialUser {
  id: number
  type: number
  openid: string
  token: string
  rawTokenInfo: string
  nickname: string
  avatar: string
  rawUserInfo: string
  code: string
  state: string
}
export interface ProfileVO {
  id: number
  username: string
  nickname: string
  dept: ProfileDept
  roles: ProfileRole[]
  posts: ProfilePost[]
  socialUsers: SocialUser[]
  email: string
  mobile: string
  sex: number
  avatar: string
  status: number
  remark: string
  loginIp: string
  loginDate: Date
  createTime: Date
}

export interface UserProfileUpdateReqVO {
  nickname: string
  email: string
  mobile: string
  sex: number
}

enum Api {
  getUserProfileApi = '/system/user/profile/get',
  putUserProfileApi = '/system/user/profile/update',
  uploadAvatarApi = '/system/user/profile/update-avatar',
  updateUserPwdApi = '/system/user/profile/update-password',
  socialBindApi = '/system/social-user/bind',
  socialUnbindApi = '/system/social-user/unbind',
}

/**
 * @description: getUserProfileApi
 */
export function getUserProfileApi() {
  return defHttp.get({ url: Api.getUserProfileApi })
}

/**
 * @description: updateUserProfileApi
 */
export function updateUserProfileApi(data: UserProfileUpdateReqVO) {
  return defHttp.put({ url: Api.putUserProfileApi, data })
}

// 用户密码重置
export function updateUserPwdApi(oldPassword: string, newPassword: string) {
  return defHttp.put({
    url: Api.updateUserPwdApi,
    data: {
      oldPassword,
      newPassword,
    },
  })
}

// 用户头像上传
export function uploadAvatarApi(data) {
  return defHttp.put({
    url: Api.uploadAvatarApi,
    headers: {
      'Content-type': ContentTypeEnum.FORM_DATA,
      'ignoreCancelToken': true,
    },
    data,
  })
}

// 社交绑定，使用 code 授权码
export function socialBind(type, code, state) {
  return defHttp.post({
    url: Api.socialBindApi,
    data: {
      type,
      code,
      state,
    },
  })
}

// 取消社交绑定
export function socialUnbind(type, openid) {
  return defHttp.delete({
    url: Api.socialUnbindApi,
    data: {
      type,
      openid,
    },
  })
}

// 社交授权的跳转
export function socialAuthRedirect(type, redirectUri) {
  return defHttp.get({
    url: `/system/auth/social-auth-redirect?type=${type}&redirectUri=${redirectUri}`,
  })
}
