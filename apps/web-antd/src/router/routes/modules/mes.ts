import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/mes',
    name: 'MesCenter',
    meta: {
      title: 'MES 制造执行',
      icon: 'lucide:factory',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: 'wm/warehouse/location',
        name: 'MesWmLocation',
        meta: {
          title: '库区设置',
          activePath: '/mes/wm/warehouse',
        },
        component: () =>
          import('#/views/mes/wm/warehouse/location/index.vue'),
      },
      {
        path: 'wm/warehouse/area',
        name: 'MesWmArea',
        meta: {
          title: '库位设置',
          activePath: '/mes/wm/warehouse',
        },
        component: () => import('#/views/mes/wm/warehouse/area/index.vue'),
      },
      {
        path: 'wm/barcode/config',
        name: 'MesWmBarcodeConfig',
        meta: {
          title: '条码配置',
          activePath: '/mes/wm/barcode',
        },
        component: () => import('#/views/mes/wm/barcode/config/index.vue'),
      },
      {
        path: 'pro/task/gantt-edit',
        name: 'MesProTaskGanttEdit',
        meta: {
          title: '甘特图编辑',
          activePath: '/mes/pro/task',
        },
        component: () => import('#/views/mes/pro/task/edit/index.vue'),
      },
    ],
  },
];

export default routes;
