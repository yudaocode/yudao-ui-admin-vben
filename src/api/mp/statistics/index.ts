import { defHttp } from '@/utils/http/axios'

// 获取消息发送概况数据
export function getUpstreamMessage(params) {
  return defHttp.get({ url: '/mp/statistics/upstream-message', params })
}

// 用户增减数据
export function getUserSummary(params) {
  return defHttp.get({ url: '/mp/statistics/user-summary', params })
}

// 获得用户累计数据
export function getUserCumulate(params) {
  return defHttp.get({ url: '/mp/statistics/user-cumulate', params })
}

// 获得接口分析数据
export function getInterfaceSummary(params) {
  return defHttp.get({ url: '/mp/statistics/interface-summary', params })
}
