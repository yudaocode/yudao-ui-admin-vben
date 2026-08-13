import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/fms',
    name: 'FmsCenter',
    meta: {
      title: '财务管理',
      icon: 'lucide:calculator',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: 'auxiliary/type/item/:auxiliaryTypeId',
        name: 'FmsAuxiliaryItem',
        redirect: (to) => ({
          path: '/fms/config/auxiliary',
          query: { auxiliaryTypeId: to.params.auxiliaryTypeId },
        }),
        meta: {
          title: '辅助核算项目',
          activePath: '/fms/config/auxiliary',
        },
      },
    ],
  },
];

export default routes;
