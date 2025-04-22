import type { Router, RouteRecordRaw } from 'vue-router';

import type {
  AppRouteRecordRaw,
  ExRouteRecordRaw,
  MenuRecordRaw,
  RouteRecordStringComponent,
} from '@vben-core/typings';

import { filterTree, isHttpUrl, mapTree } from '@vben-core/shared/utils';

/**
 * 根据 routes 生成菜单列表
 * @param routes
 */
async function generateMenus(
  routes: RouteRecordRaw[],
  router: Router,
): Promise<MenuRecordRaw[]> {
  // 将路由列表转换为一个以 name 为键的对象映射
  // 获取所有router最终的path及name
  const finalRoutesMap: { [key: string]: string } = Object.fromEntries(
    router.getRoutes().map(({ name, path }) => [name, path]),
  );

  let menus = mapTree<ExRouteRecordRaw, MenuRecordRaw>(routes, (route) => {
    // 路由表的路径写法有多种，这里从router获取到最终的path并赋值
    const path = finalRoutesMap[route.name as string] ?? route.path;

    // 转换为菜单结构
    // const path = matchRoute?.path ?? route.path;
    const { meta, name: routeName, redirect, children } = route;
    const {
      activeIcon,
      badge,
      badgeType,
      badgeVariants,
      hideChildrenInMenu = false,
      icon,
      link,
      order,
      title = '',
    } = meta || {};

    const name = (title || routeName || '') as string;

    // 隐藏子菜单
    const resultChildren = hideChildrenInMenu
      ? []
      : (children as MenuRecordRaw[]);

    // 将菜单的所有父级和父级菜单记录到菜单项内
    if (resultChildren && resultChildren.length > 0) {
      resultChildren.forEach((child) => {
        child.parents = [...(route.parents || []), path];
        child.parent = path;
      });
    }
    // 隐藏子菜单
    const resultPath = hideChildrenInMenu ? redirect || path : link || path;
    return {
      activeIcon,
      badge,
      badgeType,
      badgeVariants,
      icon,
      name,
      order,
      parent: route.parent,
      parents: route.parents,
      path: resultPath as string,
      show: !route?.meta?.hideInMenu,
      children: resultChildren || [],
    };
  });

  // 对菜单进行排序，避免order=0时被替换成999的问题
  menus = menus.sort((a, b) => (a?.order ?? 999) - (b?.order ?? 999));

  const finalMenus = filterTree(menus, (menu) => {
    return !!menu.show;
  });
  return finalMenus;
}

/**
 * 转换后端菜单数据为路由数据
 * @param menuList 后端菜单数据
 * @param parent 父级菜单
 * @returns 路由数据
 */
function convertServerMenuToRouteRecordStringComponent(
  menuList: AppRouteRecordRaw[],
  parent = '',
): RouteRecordStringComponent[] {
  const menus: RouteRecordStringComponent[] = [];
  menuList.forEach((menu) => {
    // 处理顶级链接菜单
    if (isHttpUrl(menu.path) && menu.parentId === 0) {
      const urlMenu: RouteRecordStringComponent = {
        component: 'IFrameView',
        meta: {
          hideInMenu: !menu.visible,
          icon: menu.icon,
          link: menu.path,
          orderNo: menu.sort,
          title: menu.name,
        },
        name: menu.name,
        path: `/${menu.path}/index`,
      };
      menus.push(urlMenu);
      return;
    } else if (menu.children && menu.parentId === 0) {
      menu.component = 'BasicLayout';
    } else if (!menu.children) {
      menu.component = menu.component as string;
    }
    if (menu.component === 'Layout') {
      menu.component = 'BasicLayout';
    }

    if (menu.children && menu.parentId !== 0) {
      menu.component = '';
    }

    // path
    if (parent) {
      menu.path = `${parent}/${menu.path}`;
    }

    if (!menu.path.startsWith('/')) {
      menu.path = `/${menu.path}`;
    }

    const buildMenu: RouteRecordStringComponent = {
      component: menu.component,
      meta: {
        hideInMenu: !menu.visible,
        icon: menu.icon,
        keepAlive: menu.keepAlive,
        orderNo: menu.sort,
        title: menu.name,
      },
      name: menu.name + menu.id, // add by 芋艿：防止 name 重复，加上 id
      path: menu.path,
    };

    if (menu.children && menu.children.length > 0) {
      buildMenu.children = convertServerMenuToRouteRecordStringComponent(
        menu.children,
        menu.path,
      );
    }

    menus.push(buildMenu);
  });
  return menus;
}

export { convertServerMenuToRouteRecordStringComponent, generateMenus };
