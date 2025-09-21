import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/bdm/user/detail',
    component: () => import('#/views/bdm/user/modules/detail.vue'),
    name: 'BdmUserDetail',
    meta: {
      title: '住户详情',
      icon: 'carbon:user-avatar-filled-alt',
      hideInMenu: true,
    },
  },
];

export default routes;
