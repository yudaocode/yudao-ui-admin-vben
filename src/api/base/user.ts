import { defHttp } from '@/utils/http/axios'
import { LoginParams, LoginResultModel, GetUserInfoModel } from './model/userModel'

import { ErrorMessageMode } from '@/types/axios'

enum Api {
  Login = '/system/auth/login',
  Logout = '/system/auth/logout',
  GetUserInfo = '/system/auth/get-permission-info'
}

/**
 * @description: user login api
 */
export function loginApi(params: LoginParams, mode: ErrorMessageMode = 'modal') {
  return defHttp.post<LoginResultModel>(
    {
      url: Api.Login,
      params
    },
    {
      errorMessageMode: mode
    }
  )
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
