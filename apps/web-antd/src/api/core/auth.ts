import type { YudaoUserInfo } from '#/types';

import { baseRequestClient, requestClient } from '#/api/request';
import { getRefreshToken } from '#/utils';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    captchaVerification?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    userId: number | string;
    accessToken: string;
    refreshToken: string;
    expiresTime: number;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
  export interface SmsCodeVO {
    mobile: string;
    scene: number;
  }

  export interface SmsLoginVO {
    mobile: string;
    code: string;
  }
}

/**
 * 登录
 */
export function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/system/auth/login', data);
}

/**
 * 刷新accessToken
 */
export function refreshTokenApi() {
  return requestClient.post<AuthApi.LoginResult>(
    `/system/auth/refresh-token?refreshToken=${getRefreshToken()}`,
  );
}

/**
 * 使用租户名，获得租户编号
 * @param name 租户名
 * @returns 租户编号
 */
export function getTenantIdByName(name: string) {
  return requestClient.get<number>(
    `/system/tenant/get-id-by-name?name=${name}`,
  );
}

/**
 * 使用租户域名，获得租户信息
 * @param website 域名
 * @returns 租户信息
 */
export function getTenantByWebsite(website: string) {
  return requestClient.get(`/system/tenant/get-by-website?website=${website}`);
}

/**
 * 退出登录
 */
export function logoutApi() {
  return requestClient.post('/system/auth/logout');
}

/**
 * 获取用户权限信息
 */
export function getUserInfo() {
  return requestClient.get<YudaoUserInfo>('/system/auth/get-permission-info');
}

/**
 * 获取登录验证码
 */
export function sendSmsCode(data: AuthApi.SmsCodeVO) {
  return requestClient.post('/system/auth/send-sms-code', data);
}

/**
 * 短信验证码登录
 */
export function smsLogin(data: AuthApi.SmsLoginVO) {
  return requestClient.post('/system/auth/sms-login', data);
}

/**
 * 社交快捷登录，使用 code 授权码
 */
export function socialLogin(type: string, code: string, state: string) {
  return requestClient.post('/system/auth/social-login', {
    type,
    code,
    state,
  });
}

/**
 * 社交授权的跳转
 */
export function socialAuthRedirect(type: number, redirectUri: string) {
  return requestClient.get(
    `/system/auth/social-auth-redirect?type=${type}&redirectUri=${redirectUri}`,
  );
}

/**
 * 获取验证图片 以及token
 */
export function getCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/get', data);
}

/**
 * 滑动或者点选验证
 */
export function checkCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/check', data);
}
