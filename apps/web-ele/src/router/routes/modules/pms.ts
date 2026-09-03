import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/pms',
    name: 'PmsCenter',
    meta: {
      title: '项目管理',
      icon: 'lucide:kanban-square',
      keepAlive: true,
      hideInMenu: true,
    },
    children: [
      {
        path: 'pm/iteration/detail/:id(\\d+)',
        name: 'PmsIterationDetail',
        component: () => import('#/views/pms/pm/iteration/detail/index.vue'),
        meta: {
          title: '迭代详情',
          activePath: '/pms/pm/project/list',
        },
      },
      {
        path: 'pm/project/detail/:id(\\d+)',
        name: 'PmsProjectDetail',
        component: () => import('#/views/pms/pm/project/detail/index.vue'),
        meta: {
          title: '项目详情',
          activePath: '/pms/pm/project/list',
          // 页签查询参数变化时不重复打开标签页
          fullPathKey: false,
        },
      },
      {
        path: 'pm/project/config/:id(\\d+)',
        name: 'PmsProjectConfig',
        component: () => import('#/views/pms/pm/project/config/index.vue'),
        meta: {
          title: '项目设置',
          activePath: '/pms/pm/project/list',
        },
      },
      {
        path: 'kb/library/:libraryId(\\d+)',
        name: 'PmsKnowledgeLibraryDetail',
        component: () => import('#/views/pms/kb/document/index.vue'),
        meta: {
          title: '知识库详情',
          activePath: '/pms/kb/library',
          fullPathKey: false,
        },
      },
    ],
  },
];

export default routes;
