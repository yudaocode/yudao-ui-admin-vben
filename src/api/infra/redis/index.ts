import { defHttp } from '@/utils/http/axios'

/**
 * 获取redis 监控信息
 */
export function getCache() {
  return defHttp.get({ url: '/infra/redis/get-monitor-info' })
}
// 获取模块
export function getKeyDefineList() {
  return defHttp.get({ url: '/infra/redis/get-key-define-list' })
}
/**
 * 获取redis key列表
 */
export function getKeyList(keyTemplate: string) {
  return defHttp.get({
    url: '/infra/redis/get-key-list',
    params: {
      keyTemplate
    }
  })
}
// 获取缓存内容
export function getKeyValue(key: string) {
  return defHttp.get({ url: '/infra/redis/get-key-value?key=' + key })
}

// 根据键名删除缓存
export function deleteKey(key: string) {
  return defHttp.delete({ url: '/infra/redis/delete-key?key=' + key })
}

export function deleteKeys(keyTemplate: string) {
  return defHttp.delete({
    url: '/infra/redis/delete-keys?',
    params: {
      keyTemplate
    }
  })
}
