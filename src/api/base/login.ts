import { defHttp } from '@/utils/http/axios'
import { TentantNameVO } from './model/loginModel'
import { getRefreshToken } from '@/utils/auth'

enum Api {
  Login = '/system/auth/login',
  RefreshToken = '/system/auth/refresh-token?refreshToken=',
  GetTenantIdByName = '/system/tenant/get-id-by-name?name=',
  LoginOut = '/system/auth/logout',
  GetUserInfo = '/system/auth/get-permission-info',
  GetAsyncRoutes = '/system/auth/list-menus',
  GetCaptcha = '/system/captcha/get',
  CheckCaptcha = '/system/captcha/check'
}

// 刷新访问令牌
export function refreshToken() {
  return defHttp.post({ url: Api.RefreshToken + getRefreshToken() })
}

// 使用租户名，获得租户编号
export function getTenantIdByName(name: string) {
  return defHttp.get<TentantNameVO>({ url: Api.GetTenantIdByName + name })
}

// 登出
export function loginOut() {
  return defHttp.delete({ url: Api.LoginOut })
}

// 获取用户权限信息
export function getUserInfo() {
  return defHttp.get({ url: Api.GetUserInfo })
}

// 路由
export function getAsyncRoutes() {
  return defHttp.get({ url: Api.GetAsyncRoutes })
}

// 获取验证图片  以及token
export function getCaptcha(data) {
  return defHttp.post({ url: Api.GetCaptcha, data }, { isReturnNativeResponse: true })
}

// 滑动或者点选验证
export function checkCaptcha(data) {
  return defHttp.post({ url: Api.CheckCaptcha, data }, { isReturnNativeResponse: true })
}
