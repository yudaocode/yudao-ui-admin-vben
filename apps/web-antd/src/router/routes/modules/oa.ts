import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/oa',
    name: 'OaDetail',
    meta: {
      title: 'OA 办公',
      hideInMenu: true,
    },
    children: [
      {
        path: 'reimbursement/detail/:id(\\d+)',
        name: 'OaReimbursementDetail',
        component: () => import('#/views/oa/reimbursement/detail/index.vue'),
        meta: {
          title: '费用报销',
          activePath: '/oa/process/reimbursement',
        },
      },
      {
        path: 'overtime/detail/:id(\\d+)',
        name: 'OaOvertimeApplyDetail',
        component: () => import('#/views/oa/overtime/detail/index.vue'),
        meta: {
          title: '加班申请',
          activePath: '/oa/process/overtime',
        },
      },
      {
        path: 'leave/detail/:id(\\d+)',
        name: 'OaLeaveApplyDetail',
        component: () => import('#/views/oa/leave/detail/index.vue'),
        meta: {
          title: '请假申请',
          activePath: '/oa/process/leave',
        },
      },
      {
        path: 'regular/detail/:id(\\d+)',
        name: 'OaRegularApplyDetail',
        component: () => import('#/views/oa/regular/detail/index.vue'),
        meta: {
          title: '转正申请',
          activePath: '/oa/process/regular',
        },
      },
      {
        path: 'resign/detail/:id(\\d+)',
        name: 'OaResignApplyDetail',
        component: () => import('#/views/oa/resign/detail/index.vue'),
        meta: {
          title: '离职申请',
          activePath: '/oa/process/resign',
        },
      },
      {
        path: 'discussion/detail/:id(\\d+)',
        name: 'OaDiscussionDetail',
        component: () => import('#/views/oa/discussion/detail/index.vue'),
        meta: {
          title: '讨论详情',
          activePath: '/oa/discussion/list',
        },
      },
    ],
  },
];

export default routes;
