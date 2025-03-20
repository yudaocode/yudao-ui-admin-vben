import type { BasicUserInfo } from '@vben-core/typings';
import type { RouteMeta, RouteRecordRaw } from 'vue-router';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {

  /**
   * 首页地址
   */
  homePath: string;

}

/** 权限信息 */
interface AuthPermissionInfo {

  user: UserInfo;
  roles: string[];
  permissions: string[];
  menus: AppRouteRecordRaw[];

}

/** 路由元信息 */
interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'meta'> {

  children?: AppRouteRecordRaw[];
  component?: any;
  componentName?: string;
  components?: any;
  fullPath?: string;
  icon?: string;
  keepAlive?: boolean;
  meta: RouteMeta;
  name: string;
  parentId?: number;
  props?: any;
  sort?: number;
  visible?: boolean;

}

export type { UserInfo, AuthPermissionInfo, AppRouteRecordRaw };
