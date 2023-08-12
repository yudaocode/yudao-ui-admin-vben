import { defHttp } from '@/utils/http/axios'

/**
 * 获取redis 监控信息
 */
export function getCache() {
  return defHttp.get({ url: '/infra/redis/get-monitor-info' })
}
