import type { AppRouteModule, AppRouteRecordRaw } from '@/router/types'

import { PAGE_NOT_FOUND_ROUTE, REDIRECT_ROUTE } from '@/router/routes/basic'

import { PageEnum } from '@/enums/pageEnum'
import { t } from '@/hooks/web/useI18n'
import { LAYOUT } from '@/router/constant'

// import.meta.glob() 直接引入所有的模块 Vite 独有的功能
const modules = import.meta.glob('./modules/**/*.ts', { eager: true })
const routeModuleList: AppRouteModule[] = []

// 加入到路由集合中
Object.keys(modules).forEach((key) => {
  const mod = (modules as Recordable)[key].default || {}
  const modList = Array.isArray(mod) ? [...mod] : [mod]
  routeModuleList.push(...modList)
})

export const asyncRoutes = [PAGE_NOT_FOUND_ROUTE, ...routeModuleList]

// 根路由
export const RootRoute: AppRouteRecordRaw = {
  path: '/',
  name: 'Root',
  redirect: PageEnum.BASE_HOME,
  meta: {
    title: 'Root',
  },
}

export const LoginRoute: AppRouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/base/login/Login.vue'),
  meta: {
    title: t('routes.basic.login'),
  },
}

export const SSORoute: AppRouteRecordRaw = {
  path: '/sso',
  name: 'SSO',
  component: () => import('@/views/base/login/sso.vue'),
  meta: {
    title: t('routes.basic.sso'),
  },
}

export const ProfileRoute: AppRouteRecordRaw = {
  path: '/profile',
  component: LAYOUT,
  name: 'Profile',
  meta: {
    title: t('routes.basic.profile'),
    hidden: true,
  },
  children: [
    {
      path: 'index',
      component: () => import('@/views/base/profile/index.vue'),
      name: 'UserProfile',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:user-outlined',
        title: t('routes.basic.profile'),
      },
    },
    {
      path: 'notify-message',
      component: () => import('@/views/system/notify/my/index.vue'),
      name: 'MyNotifyMessage',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:bell-outlined',
        title: t('routes.basic.notifyMessage'),
      },
    },
  ],
}

export const CodegenRoute: AppRouteRecordRaw = {
  path: '/codegen',
  component: LAYOUT,
  name: 'CodegenEdit',
  meta: {
    title: '修改生成配置',
    hidden: true,
  },
  children: [
    {
      path: 'editTable',
      component: () => import('@/views/infra/codegen/EditTable.vue'),
      name: 'EditTable',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '修改生成配置',
        activeMenu: 'infra/codegen/index',
      },
    },
  ],
}

export const JobLogRoute: AppRouteRecordRaw = {
  path: '/job',
  component: LAYOUT,
  name: 'JobL',
  meta: {
    title: '调度日志',
    hidden: true,
  },
  children: [
    {
      path: 'job-log',
      component: () => import('@/views/infra/job/logger/index.vue'),
      name: 'InfraJobLog',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:bar-chart-outlined',
        title: '调度日志',
        activeMenu: 'infra/job/index',
      },
    },
  ],
}

export const PayRoute: AppRouteRecordRaw = {
  path: '/cashRegister',
  component: LAYOUT,
  name: 'cashRegister',
  meta: {
    title: '收银台',
    hidden: true,
  },
  children: [
    {
      path: 'submit',
      component: () => import('@/views/pay/submit/index.vue'),
      name: 'PayOrderSubmit',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:pay-circle-outlined',
        title: '收银台',
        activeMenu: 'pay/order/index',
      },
    },
  ],
}

export const BpmRoute: AppRouteRecordRaw = {
  path: '/bpm',
  component: LAYOUT,
  name: 'bpm',
  meta: {
    title: '工作流',
    hidden: true,
  },
  children: [
    {
      path: '/manager/form/edit',
      component: () => import('@/views/bpm/form/editor/index.vue'),
      name: 'BpmFormEditor',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '设计流程表单',
        activeMenu: '/bpm/manager/form',
      },
    },
    {
      path: '/manager/model/edit',
      component: () => import('@/views/bpm/model/editor/index.vue'),
      name: 'BpmModelEditor',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '设计流程',
        activeMenu: '/bpm/manager/model',
      },
    },
    {
      path: '/manager/definition',
      component: () => import('@/views/bpm/definition/index.vue'),
      name: 'BpmProcessDefinition',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '流程定义',
        activeMenu: '/bpm/manager/model',
      },
    },
    {
      path: '/manager/task-assign-rule',
      component: () => import('@/views/bpm/taskAssignRule/index.vue'),
      name: 'BpmTaskAssignRuleList',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '任务分配规则',
      },
    },
    {
      path: '/process-instance/create',
      component: () => import('@/views/bpm/processInstance/create/index.vue'),
      name: 'BpmProcessInstanceCreate',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '发起流程',
        activeMenu: 'bpm/processInstance/create',
      },
    },
    {
      path: '/process-instance/detail',
      component: () => import('@/views/bpm/processInstance/detail/index.vue'),
      name: 'BpmProcessInstanceDetail',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '流程详情',
        activeMenu: 'bpm/processInstance/detail',
      },
    },
    {
      path: '/bpm/oa/leave/create',
      component: () => import('@/views/bpm/oa/leave/create.vue'),
      name: 'OALeaveCreate',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '发起 OA 请假',
        activeMenu: 'bpm/oa/leave',
      },
    },
    {
      path: '/process-instance/detail',
      component: () => import('@/views/bpm/oa/leave/detail.vue'),
      name: 'OALeaveDetail',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ant-design:edit-outlined',
        title: '查看 OA 请假',
        activeMenu: 'bpm/oa/leave',
      },
    },
  ],
}

// Basic routing without permission
// 未经许可的基本路由
export const basicRoutes = [
  LoginRoute,
  SSORoute,
  RootRoute,
  ProfileRoute,
  CodegenRoute,
  JobLogRoute,
  PayRoute,
  BpmRoute,
  REDIRECT_ROUTE,
  PAGE_NOT_FOUND_ROUTE,
]
