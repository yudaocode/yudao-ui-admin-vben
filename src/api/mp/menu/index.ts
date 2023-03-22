import { defHttp } from '@/utils/http/axios'

// 获得公众号菜单列表
export const getMenuList = (accountId) => {
  return defHttp.get({ url: '/mp/menu/list?accountId=' + accountId })
}

// 保存公众号菜单
export const saveMenu = (accountId, menus) => {
  return defHttp.post({
    url: '/mp/menu/save',
    data: {
      accountId,
      menus
    }
  })
}

// 删除公众号菜单
export const deleteMenu = (accountId) => {
  return defHttp.delete({ url: '/mp/menu/delete?accountId=' + accountId })
}
