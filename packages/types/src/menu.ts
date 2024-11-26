import type { RouteMeta, RouteRecordRaw } from 'vue-router';

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

export type { AppRouteRecordRaw };
