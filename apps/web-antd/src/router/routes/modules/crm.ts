import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/crm',
    name: 'CrmCenter',
    meta: {
      title: '客户管理',
      icon: 'simple-icons:civicrm',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: 'clue/detail/:id',
        name: 'CrmClueDetail',
        meta: {
          title: '线索详情',
          activeMenu: '/crm/clue',
        },
        component: () => import('#/views/crm/clue/modules/detail.vue'),
      },
      {
        path: 'customer/detail/:id',
        name: 'CrmCustomerDetail',
        meta: {
          title: '客户详情',
          activeMenu: '/crm/customer',
        },
        component: () => import('#/views/crm/customer/modules/detail.vue'),
      },
      {
        path: 'business/detail/:id',
        name: 'CrmBusinessDetail',
        meta: {
          title: '商机详情',
          activeMenu: '/crm/business',
        },
        component: () => import('#/views/crm/business/modules/detail.vue'),
      },
      {
        path: 'contract/detail/:id',
        name: 'CrmContractDetail',
        meta: {
          title: '合同详情',
          activeMenu: '/crm/contract',
        },
        component: () => import('#/views/crm/contract/modules/detail.vue'),
      },
      {
        path: 'receivable-plan/detail/:id',
        name: 'CrmReceivablePlanDetail',
        meta: {
          title: '回款计划详情',
          activeMenu: '/crm/receivable-plan',
        },
        component: () =>
          import('#/views/crm/receivable/plan/modules/detail.vue'),
      },
      {
        path: 'receivable/detail/:id',
        name: 'CrmReceivableDetail',
        meta: {
          title: '回款详情',
          activeMenu: '/crm/receivable',
        },
        component: () => import('#/views/crm/receivable/modules/detail.vue'),
      },
      {
        path: 'contact/detail/:id',
        name: 'CrmContactDetail',
        meta: {
          title: '联系人详情',
          activeMenu: '/crm/contact',
        },
        component: () => import('#/views/crm/contact/modules/detail.vue'),
      },
      {
        path: 'product/detail/:id',
        name: 'CrmProductDetail',
        meta: {
          title: '产品详情',
          activeMenu: '/crm/product',
        },
        component: () => import('#/views/crm/product/modules/detail.vue'),
      },
    ],
  },
];

export default routes;
