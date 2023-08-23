import { defHttp } from '@/utils/http/axios'

export function getActivityList(params) {
  return defHttp.get({ url: '/bpm/activity/list', params })
}
