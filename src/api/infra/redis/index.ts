import { defHttp } from '@/utils/http/axios'

/**
 * 获取redis 监控信息
 */
export const getCacheApi = () => {
  return defHttp.get({ url: '/infra/redis/get-monitor-info' })
}
// 获取模块
export const getKeyDefineListApi = () => {
  return defHttp.get({ url: '/infra/redis/get-key-define-list' })
}
/**
 * 获取redis key列表
 */
export const getKeyListApi = (keyTemplate: string) => {
  return defHttp.get({
    url: '/infra/redis/get-key-list',
    params: {
      keyTemplate
    }
  })
}
// 获取缓存内容
export const getKeyValueApi = (key: string) => {
  return defHttp.get({ url: '/infra/redis/get-key-value?key=' + key })
}

// 根据键名删除缓存
export const deleteKeyApi = (key: string) => {
  return defHttp.delete({ url: '/infra/redis/delete-key?key=' + key })
}

export const deleteKeysApi = (keyTemplate: string) => {
  return defHttp.delete({
    url: '/infra/redis/delete-keys?',
    params: {
      keyTemplate
    }
  })
}
