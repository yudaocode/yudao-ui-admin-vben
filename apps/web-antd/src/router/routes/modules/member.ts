import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/member/user/detail',
    component: () => import('#/views/member/user/modules/detail.vue'),
    name: 'MemberUserDetail',
    meta: {
      title: '会员详情',
      icon: 'lucide:user',
      hideInMenu: true,
    },
  },
];

export default routes;
