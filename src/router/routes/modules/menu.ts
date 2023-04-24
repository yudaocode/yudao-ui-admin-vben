import type { AppRouteModule } from '@/router/types'

import { LAYOUT } from '@/router/constant'

const menu: AppRouteModule = {
  path: '/sysmenu',
  name: 'SysMenu',
  component: LAYOUT,
  redirect: '/sysmenu/index',
  meta: {
    hideChildrenInMenu: true,
    icon: 'ant-design:bank-twotone',
    title: '系统菜单',
    orderNo: 9999
  },
  children: [
    {
      path: 'index',
      name: 'SystemMenu',
      component: () => import('@/views/system/menu/index.vue'),
      meta: {
        title: '系统菜单',
        icon: 'ant-design:bank-twotone',
        hideMenu: true
      }
    }
  ]
}

export default menu
