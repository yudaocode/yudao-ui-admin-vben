import { defHttp } from '@/utils/http/axios'

export interface ConfigVO {
  id: number
  tradeDeductEnable: number
  tradeDeductUnitPrice: number
  tradeDeductMaxPrice: number
  tradeGivePoint: number
}

// 查询积分设置详情
export function getConfig() {
  return defHttp.get({ url: '/member/point/config/get' })
}

// 新增修改积分设置
export function saveConfig(data: ConfigVO) {
  return defHttp.put({ url: '/member/point/config/save', data })
}
