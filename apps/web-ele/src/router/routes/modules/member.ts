import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/member/user/detail',
    component: () => import('#/views/member/user/detail/detail.vue'),
    name: 'MemberUserDetail',
    meta: {
      title: '会员详情',
      icon: 'lucide:user',
      activePath: '/member/user',
      hideInMenu: true,
    },
  },
];

export default routes;
