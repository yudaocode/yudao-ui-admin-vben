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
  {
    path: '/member/contact',
    component: () => import('#/views/member/contact/index.vue'),
    name: 'MemberContact',
    meta: {
      title: '联系人',
      icon: 'carbon:notebook-reference',
      hideInMenu: true,
    },
  },
];

export default routes;
