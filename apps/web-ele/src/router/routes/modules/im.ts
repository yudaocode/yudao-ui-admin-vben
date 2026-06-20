import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/im/home',
    name: 'ImHome',
    component: () => import('#/views/im/home/index.vue'),
    redirect: '/im/home/conversation',
    meta: {
      title: 'IM 即时通讯',
      hideInMenu: true,
      hideInTab: true,
      keepAlive: true,
      noBasicLayout: true,
    },
    children: [
      {
        path: 'conversation',
        name: 'ImHomeConversation',
        component: () => import('#/views/im/home/pages/conversation/index.vue'),
        meta: {
          title: '消息',
          activePath: '/im/home/conversation',
          hideInMenu: true,
          hideInTab: true,
        },
      },
      {
        path: 'contact',
        name: 'ImHomeContact',
        component: () => import('#/views/im/home/pages/contact/index.vue'),
        meta: {
          title: '通讯录',
          activePath: '/im/home/contact',
          hideInMenu: true,
          hideInTab: true,
        },
      },
    ],
  },
];

export default routes;
