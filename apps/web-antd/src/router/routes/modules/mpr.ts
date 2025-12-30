import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/assistant/pay-return',
    name: 'PayReturn',
    component: () => import('#/views/mpr/assistant/PayReturn.vue'),
    meta: {
      title: '支付完成',
      icon: 'ant-design:pay-circle-outlined',
      activePath: '/mpr/assistant',
      hideInMenu: true,
    },
  },
  {
    path: '/assistant/pay',
    name: 'AraPayment',
    component: () => import('#/views/mpr/assistant/AraPayment.vue'),
    meta: {
      title: '助理支付',
      icon: 'ant-design:pay-circle-outlined',
      activePath: '/mpr/assistant',
      keepAlive: true,
      hideInMenu: true,
    },
  },
  {
    path: '/payment',
    name: 'StripePayment',
    component: () => import('#/views/payment/StripePayment.vue'), // 引入你刚才创建的支付页面
    meta: {
      title: '支付',
      icon: 'ant-design:credit-card-outlined',
      hideInMenu: true,
    },
  },
  {
    path: '/checkout',
    name: 'StripeCheckout',
    component: () => import('#/views/payment/StripeCheckout.vue'), // 引入你刚才创建的支付页面
    meta: {
      title: '支付',
      icon: 'ant-design:credit-card-outlined',
      keepAlive: true,
      hideInMenu: true,
    },
  },
  {
    path: '/assistant',
    name: 'AssistantEdit',
    meta: {
      title: '助理',
      icon: 'ic:baseline-view-in-ar',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: '/assistant/edit',
        name: 'CreateAra',
        component: () => import('#/views/mpr/assistant/CreateAra.vue'),
        meta: {
          title: '配置助理',
          activePath: '/mpr/assistant',
        },
      },
    ],
  },
];

export default routes;
