import { defHttp } from '@/utils/http/axios'

// 获得地区树
export const getAreaTree = () => {
  return defHttp.get({ url: '/system/area/tree' })
}

// 获得 IP 对应的地区名
export const getAreaByIp = (ip: string) => {
  return defHttp.get({ url: '/system/area/get-by-ip?ip=' + ip })
}
