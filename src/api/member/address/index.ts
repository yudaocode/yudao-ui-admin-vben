import { defHttp } from '@/utils/http/axios'

export interface AddressVO {
  id: number
  name: string
  mobile: string
  areaId: number
  detailAddress: string
  defaultStatus: boolean
}

// 查询用户收件地址列表
export function getAddressList(params) {
  return defHttp.get({ url: '/member/address/list', params })
}
