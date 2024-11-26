import type { BasicUserInfo } from '@vben-core/typings';

import type { AppRouteRecordRaw } from './menu';

interface ExUserInfo extends BasicUserInfo {
  deptId: number;
  nickname: string;
}

interface AuthPermissionInfo {
  permissions: string[];
  menus: AppRouteRecordRaw[];
  roles: string[];
  homePath: string;
  user: ExUserInfo;
}

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;
}

export type { AuthPermissionInfo, ExUserInfo, UserInfo };
