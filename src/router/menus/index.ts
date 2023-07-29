import type { RouteRecordNormalized } from 'vue-router'
import { pathToRegexp } from 'path-to-regexp'
import type { Menu, MenuModule } from '@/router/types'

import { useAppStoreWithOut } from '@/store/modules/app'
import { usePermissionStore } from '@/store/modules/permission'
import { getAllParentPath, transformMenuModule } from '@/router/helper/menuHelper'
import { filter } from '@/utils/helper/treeHelper'
import { isUrl } from '@/utils/is'
import { router } from '@/router'
import { PermissionModeEnum } from '@/enums/appEnum'

const modules = import.meta.glob('./modules/**/*.ts', { eager: true })

const menuModules: MenuModule[] = []

Object.keys(modules).forEach((key) => {
  const mod = (modules as Recordable)[key].default || {}
  const modList = Array.isArray(mod) ? [...mod] : [mod]
  menuModules.push(...modList)
})

// ===========================
// ==========Helper===========
// ===========================

function getPermissionMode() {
  const appStore = useAppStoreWithOut()
  return appStore.getProjectConfig.permissionMode
}
function isBackMode() {
  return getPermissionMode() === PermissionModeEnum.BACK
}

function isRouteMappingMode() {
  return getPermissionMode() === PermissionModeEnum.ROUTE_MAPPING
}

function isRoleMode() {
  return getPermissionMode() === PermissionModeEnum.ROLE
}

const staticMenus: Menu[] = []
;(() => {
  menuModules.sort((a, b) => {
    return (a.orderNo || 0) - (b.orderNo || 0)
  })

  for (const menu of menuModules)
    staticMenus.push(transformMenuModule(menu))
})()

function getAsyncMenus() {
  const permissionStore = usePermissionStore()
  // 递归过滤所有隐藏的菜单
  const menuFilter = (items) => {
    return items.filter((item) => {
      const show = !item.meta?.hideMenu && !item.hideMenu
      if (show && item.children)
        item.children = menuFilter(item.children)

      return show
    })
  }
  if (isBackMode())
    return menuFilter(permissionStore.getBackMenuList)

  if (isRouteMappingMode())
    return menuFilter(permissionStore.getFrontMenuList)

  return staticMenus
}

export async function getMenus(): Promise<Menu[]> {
  const menus = await getAsyncMenus()
  if (isRoleMode()) {
    const routes = router.getRoutes()
    return filter(menus, basicFilter(routes))
  }
  return menus
}

export async function getCurrentParentPath(currentPath: string) {
  const menus = await getAsyncMenus()
  const allParentPath = getAllParentPath(menus, currentPath)
  return allParentPath?.[0]
}

// Get the level 1 menu, delete children
export async function getShallowMenus(): Promise<Menu[]> {
  const menus = await getAsyncMenus()
  const shallowMenuList = menus.map(item => ({ ...item, children: undefined }))
  if (isRoleMode()) {
    const routes = router.getRoutes()
    return shallowMenuList.filter(basicFilter(routes))
  }
  return shallowMenuList
}

// Get the children of the menu
export async function getChildrenMenus(parentPath: string) {
  const menus = await getMenus()
  const parent = menus.find(item => item.path === parentPath)
  if (!parent || !parent.children || !!parent?.meta?.hideChildrenInMenu)
    return [] as Menu[]

  if (isRoleMode()) {
    const routes = router.getRoutes()
    return filter(parent.children, basicFilter(routes))
  }
  return parent.children
}

function basicFilter(routes: RouteRecordNormalized[]) {
  return (menu: Menu) => {
    const matchRoute = routes.find((route) => {
      if (isUrl(menu.path))
        return true

      if (route.meta?.carryParam)
        return pathToRegexp(route.path).test(menu.path)

      const isSame = route.path === menu.path
      if (!isSame)
        return false

      if (route.meta?.ignoreAuth)
        return true

      return isSame || pathToRegexp(route.path).test(menu.path)
    })

    if (!matchRoute)
      return false
    menu.icon = (menu.icon || matchRoute.meta.icon) as string
    menu.meta = matchRoute.meta
    return true
  }
}
