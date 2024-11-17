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
  return baseRequestClient.post<AuthApi.LoginResult>(
    `/system/auth/refresh-token?refreshToken=${getRefreshToken()}`,
    {
      withCredentials: true,
    },
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
  return baseRequestClient.post('/system/auth/logout', {
    withCredentials: true,
  });
}

// 获取用户权限信息
export function getUserInfo() {
  return requestClient.get<YudaoUserInfo>('/system/auth/get-permission-info');
}

/**
 * 获取验证图片 以及token
 */
export function getCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/get', data, {
    // isReturnNativeResponse: true,
  });
}

/**
 * 滑动或者点选验证
 */
export function checkCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/check', data, {
    // isReturnNativeResponse: true,
  });
}
