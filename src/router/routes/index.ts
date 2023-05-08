import type { AppRouteRecordRaw, AppRouteModule } from '@/router/types'

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
    title: 'Root'
  }
}

export const LoginRoute: AppRouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('@/views/base/login/Login.vue'),
  meta: {
    title: t('routes.basic.login')
  }
}

export const ProfileRoute: AppRouteRecordRaw = {
  path: '/profile',
  component: LAYOUT,
  name: 'Profile',
  meta: {
    title: t('routes.basic.profile'),
    hidden: true
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
        icon: 'ep:user',
        title: t('routes.basic.profile')
      }
    },
    {
      path: 'notify-message',
      component: () => import('@/views/system/notify/my/index.vue'),
      name: 'MyNotifyMessage',
      meta: {
        canTo: true,
        hidden: true,
        noTagsView: false,
        icon: 'ep:message',
        title: t('routes.basic.notifyMessage')
      }
    }
  ]
}

export const CodegenRoute: AppRouteRecordRaw = {
  path: '/codegen',
  component: LAYOUT,
  name: 'CodegenEdit',
  meta: {
    title: '修改生成配置',
    hidden: true
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
        icon: 'ep:edit',
        title: '修改生成配置',
        activeMenu: 'infra/codegen/index'
      }
    }
  ]
}

export const JobLogRoute: AppRouteRecordRaw = {
  path: '/job',
  component: LAYOUT,
  name: 'JobL',
  meta: {
    title: '调度日志',
    hidden: true
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
        icon: 'ep:edit',
        title: '调度日志',
        activeMenu: 'infra/job/index'
      }
    }
  ]
}

// Basic routing without permission
// 未经许可的基本路由
export const basicRoutes = [LoginRoute, RootRoute, ProfileRoute, CodegenRoute, JobLogRoute, REDIRECT_ROUTE, PAGE_NOT_FOUND_ROUTE]
