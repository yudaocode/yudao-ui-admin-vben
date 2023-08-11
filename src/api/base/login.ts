import type { TentantNameVO } from './model/loginModel'
import { defHttp } from '@/utils/http/axios'
import { getRefreshToken } from '@/utils/auth'

enum Api {
  Login = '/system/auth/login',
  RefreshToken = '/system/auth/refresh-token?refreshToken=',
  GetTenantIdByName = '/system/tenant/get-id-by-name?name=',
  LoginOut = '/system/auth/logout',
  GetUserInfo = '/system/auth/get-permission-info',
  GetCaptcha = '/system/captcha/get',
  CheckCaptcha = '/system/captcha/check',
}

// 刷新访问令牌
export function refreshToken() {
  const refreshToken: string = getRefreshToken()
  return defHttp.post({ url: Api.RefreshToken + refreshToken })
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

// 获取登录验证码
export function sendSmsCode(mobile, scene) {
  return defHttp.post({
    url: '/system/auth/send-sms-code',
    data: {
      mobile,
      scene,
    },
  })
}

// 获取验证图片  以及token
export function getCaptcha(data) {
  return defHttp.post({ url: Api.GetCaptcha, data }, { isReturnNativeResponse: true })
}

// 滑动或者点选验证
export function checkCaptcha(data) {
  return defHttp.post({ url: Api.CheckCaptcha, data }, { isReturnNativeResponse: true })
}

// ========== OAUTH 2.0 相关 ==========

export function getAuthorize(clientId) {
  return defHttp.get({ url: `/system/oauth2/authorize?clientId=${clientId}` })
}

export function authorize(responseType, clientId, redirectUri, state, autoApprove, checkedScopes, uncheckedScopes) {
  // 构建 scopes
  const scopes = {}
  for (const scope of checkedScopes)
    scopes[scope] = true

  for (const scope of uncheckedScopes)
    scopes[scope] = false

  // 发起请求
  return defHttp.post({
    url: '/system/oauth2/authorize',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    params: {
      response_type: responseType,
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      auto_approve: autoApprove,
      scope: JSON.stringify(scopes),
    },
  })
}
