import type { GetUserInfoModel, LoginParams, LoginResultModel, SmsLoginParams } from './model/userModel'
import { defHttp } from '@/utils/http/axios'

import type { ErrorMessageMode } from '@/types/axios'

enum Api {
  Login = '/system/auth/login',
  Logout = '/system/auth/logout',
  SmsLogin = '/system/auth/sms-login',
  GetUserInfo = '/system/auth/get-permission-info',
}

/**
 * @description: user login api
 */
export function loginApi(params: LoginParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post<LoginResultModel>({ url: Api.Login, params }, { errorMessageMode: mode })
}

/**
 * @description: user smslogin api
 */
export function smsLogin(params: SmsLoginParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post<LoginResultModel>({ url: Api.SmsLogin, params }, { errorMessageMode: mode })
}

/**
 * @description: getUserInfo
 */
export function getUserInfo() {
  return defHttp.get<GetUserInfoModel>({ url: Api.GetUserInfo }, { errorMessageMode: 'none' })
}

export function doLogout() {
  return defHttp.post({ url: Api.Logout })
}
