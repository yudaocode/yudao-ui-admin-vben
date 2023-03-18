import { defHttp } from '@/utils/http/axios'
import { LoginParams, LoginResultModel, GetUserInfoModel } from './model/userModel'

import { ErrorMessageMode } from '@/types/axios'

enum Api {
  Login = '/login',
  Logout = '/logout',
  GetUserInfo = '/getUserInfo',
  GetPermCode = '/getPermCode',
  TestRetry = '/testRetry'
}

/**
 * @description: user login api
 */
export const loginApi = (params: LoginParams, mode: ErrorMessageMode = 'modal') => {
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
export const getUserInfo = () => {
  return defHttp.get<GetUserInfoModel>({ url: Api.GetUserInfo }, { errorMessageMode: 'none' })
}

export const getPermCode = () => {
  return defHttp.get<string[]>({ url: Api.GetPermCode })
}

export const doLogout = () => {
  return defHttp.get({ url: Api.Logout })
}

export const testRetry = () => {
  return defHttp.get(
    { url: Api.TestRetry },
    {
      retryRequest: {
        isOpenRetry: true,
        count: 5,
        waitTime: 1000
      }
    }
  )
}
