import type { BasicUserInfo } from '@vben/types';

import type { AppRouteRecordRaw } from '#/types';

/** 用户信息 */
type ExBasicUserInfo = {
  deptId: number;
} & BasicUserInfo;

/** 用户信息 */
interface YudaoUserInfo extends ExBasicUserInfo {
  permissions: string[];
  menus: AppRouteRecordRaw[];
  /**
   * 首页地址
   */
  homePath: string;
  roles: string[];
  user: ExBasicUserInfo;
}

export type { ExBasicUserInfo, YudaoUserInfo };
