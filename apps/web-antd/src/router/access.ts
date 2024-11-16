import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';
import { cloneDeep } from '@vben/utils';

import { message } from 'ant-design-vue';

import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

import { buildMenus } from './helper';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

/**
 * base路由
 */
const baseMenus: RouteRecordStringComponent[] = [
  {
    component: 'BasicLayout',
    meta: {
      order: -1,
      title: 'page.dashboard.title',
    },
    name: 'Dashboard',
    path: '/',
    redirect: '/analytics',
    children: [
      {
        name: 'Analytics',
        path: '/analytics',
        component: '/dashboard/analytics/index',
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: 'page.dashboard.analytics',
        },
      },
      {
        name: 'Workspace',
        path: '/workspace',
        component: '/dashboard/workspace/index',
        meta: {
          icon: 'carbon:workspace',
          title: 'page.dashboard.workspace',
        },
      },
      {
        name: 'VbenAbout',
        path: '/about',
        component: '/_core/about/index.vue',
        meta: {
          icon: 'lucide:copyright',
          title: 'demos.vben.about',
        },
      },
    ],
  },
  {
    component: 'BasicLayout',
    meta: {
      icon: 'ant-design:user-outlined',
      order: -1,
      title: '个人中心',
      hideInMenu: true,
    },
    name: 'profile',
    path: '/profile',
    children: [
      {
        name: 'UserProfile',
        path: '/profile/index',
        component: '/_core/profile/profile.vue',
        meta: {
          icon: 'ant-design:user-outlined',
          title: '个人中心',
          hideInMenu: true,
        },
      },
    ],
  },
];

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      const userStore = useUserStore();
      const menus = userStore.userInfo?.menus;
      const routes = buildMenus(menus);
      const menuList = [...cloneDeep(baseMenus), ...routes];
      return menuList;
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
