import type { RouteRecordRaw } from 'vue-router';

/** PMS 知识文档公开分享页：不含布局、免登录访问 */
const routes: RouteRecordRaw[] = [
  {
    path: '/pms/kb/document/share/:token',
    name: 'PmsKnowledgeDocumentShare',
    component: () => import('#/views/pms/kb/document/share/index.vue'),
    meta: {
      title: '知识文档分享',
      hideInMenu: true,
      ignoreAccess: true,
    },
  },
];

export default routes;
