import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/hrm',
    name: 'HrmCenter',
    meta: {
      title: '人力资源',
      icon: 'lucide:users',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: 'dept/detail/:id',
        name: 'HrmDeptDetail',
        meta: {
          title: '组织详情',
          activePath: '/hrm/dept',
        },
        component: () => import('#/views/hrm/dept/detail/index.vue'),
      },
      {
        path: 'recruit/candidate/detail/:id',
        name: 'HrmRecruitCandidateDetail',
        meta: {
          title: '候选人详情',
          activePath: '/hrm/recruit/candidate',
        },
        component: () =>
          import('#/views/hrm/recruit/candidate/detail/index.vue'),
      },
    ],
  },
];

export default routes;
