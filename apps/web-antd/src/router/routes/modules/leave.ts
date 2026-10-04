import type { RouteRecordRaw } from 'vue-router';

// OA 请假相关路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/bpm/oa',
    name: 'OALeave',
    meta: {
      title: 'OA请假',
      hideInMenu: true,
      redirect: '/bpm/oa/leave',
    },
    children: [
      {
        path: 'leave/create',
        name: 'OALeaveCreate',
        component: () => import('#/views/bpm/oa/leave/create.vue'),
        meta: {
          title: '创建请假',
          activePath: '/bpm/oa/leave',
        },
      },
      {
        path: 'leave/detail',
        name: 'OALeaveDetail',
        component: () => import('#/views/bpm/oa/leave/detail.vue'),
        meta: {
          title: '请假详情',
          activePath: '/bpm/oa/leave',
        },
      },
    ],
  },
];

export default routes;
