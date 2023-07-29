import { defHttp } from '@/utils/http/axios'

export interface MerchantVO {
  id: number
  no: string
  name: string
  shortName: string
  status: number
  remark: string
  createTime: Date
}

export interface MerchantPageReqVO extends PageParam {
  no?: string
  name?: string
  shortName?: string
  status?: number
  remark?: string
  createTime?: Date[]
}

export interface MerchantExportReqVO {
  no?: string
  name?: string
  shortName?: string
  status?: number
  remark?: string
  createTime?: Date[]
}

// 查询列表支付商户
export function getMerchantPage(params: MerchantPageReqVO) {
  return defHttp.get({ url: '/pay/merchant/page', params })
}

// 查询详情支付商户
export function getMerchant(id: number) {
  return defHttp.get({ url: `/pay/merchant/get?id=${id}` })
}

// 根据商户名称搜索商户列表
export function getMerchantListByName(name: string) {
  return defHttp.get({
    url: '/pay/merchant/list-by-name?id=',
    params: {
      name,
    },
  })
}

// 新增支付商户
export function createMerchant(data: MerchantVO) {
  return defHttp.post({ url: '/pay/merchant/create', data })
}

// 修改支付商户
export function updateMerchant(data: MerchantVO) {
  return defHttp.put({ url: '/pay/merchant/update', data })
}

// 删除支付商户
export function deleteMerchant(id: number) {
  return defHttp.delete({ url: `/pay/merchant/delete?id=${id}` })
}

// 导出支付商户
export function exportMerchant(params: MerchantExportReqVO) {
  return defHttp.download({ url: '/pay/merchant/export-excel', params }, '支付商户.xls')
}
// 支付商户状态修改
export function changeMerchantStatus(id: number, status: number) {
  const data = {
    id,
    status,
  }
  return defHttp.put({ url: '/pay/merchant/update-status', data })
}
