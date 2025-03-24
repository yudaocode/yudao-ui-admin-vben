import { baseRequestClient, requestClient } from '#/api/request';
import type { AuthPermissionInfo } from '@vben/types';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    captchaVerification?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    userId: number;
    expiresTime: number;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 租户信息返回值 */
  export interface TenantResult {
    id: number;
    name: string;
  }

}

/** 登录 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/system/auth/login', data);
}

/** 刷新 accessToken */
export async function refreshTokenApi() {
  // TODO @芋艿：refreshToken 传递
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/system/auth/refresh', {
    withCredentials: true,
  });
}

/** 退出登录 */
export async function logoutApi() {
  return baseRequestClient.post('/system/auth/logout', {
    withCredentials: true,
  });
}

/** 获取权限信息 */
export function getAuthPermissionInfoApi() {
  return requestClient.get<AuthPermissionInfo>(
    '/system/auth/get-permission-info',
  );
}

/** 获取租户列表 */
export function getTenantSimpleList() {
  return requestClient.get<AuthApi.TenantResult[]>(
    `/system/tenant/simple-list`,
  );
}

/** 使用租户域名，获得租户信息 */
export function getTenantByWebsite(website: string) {
  return requestClient.get<AuthApi.TenantResult>(`/system/tenant/get-by-website?website=${website}`);
}

/** 获取验证码 */
export async function getCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/get', data);
}

/** 校验验证码 */
export async function checkCaptcha(data: any) {
  return baseRequestClient.post('/system/captcha/check', data);
}