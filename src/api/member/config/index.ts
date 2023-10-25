import { defHttp } from '@/utils/http/axios'

export interface ConfigVO {
  id: number
  pointTradeDeductEnable: number
  pointTradeDeductUnitPrice: number
  pointTradeDeductMaxPrice: number
  pointTradeGivePoint: number
}

// 查询积分设置详情
export async function getConfig() {
  return await defHttp.get({ url: '/member/config/get' })
}

// 新增修改积分设置
export async function saveConfig(data: ConfigVO) {
  return await defHttp.put({ url: '/member/config/save', data })
}
