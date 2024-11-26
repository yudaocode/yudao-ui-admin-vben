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

export type { AuthPermissionInfo, ExUserInfo };
