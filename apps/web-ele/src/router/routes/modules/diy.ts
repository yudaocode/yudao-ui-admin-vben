import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/diy',
    name: 'DiyCenter',
    meta: { hidden: true },
    component: Layout,
    children: [
      {
        path: 'template/decorate/:id',
        name: 'DiyTemplateDecorate',
        meta: {
          title: '模板装修',
          noCache: false,
          hidden: true,
          activeMenu: '/mall/promotion/diy-template/diy-template',
        },
        component: () =>
          import('#/views/mall/promotion/diy/template/modules/decorate.vue'),
      },
      {
        path: 'page/decorate/:id',
        name: 'DiyPageDecorate',
        meta: {
          title: '页面装修',
          noCache: false,
          hidden: true,
          activeMenu: '/mall/promotion/diy-template/diy-page',
        },
        component: () =>
          import('#/views/mall/promotion/diy/page/modules/decorate.vue'),
      },
    ],
  },
];

export default routes;
