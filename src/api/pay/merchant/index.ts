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
export const getMerchantPageApi = (params: MerchantPageReqVO) => {
  return defHttp.get({ url: '/pay/merchant/page', params })
}

// 查询详情支付商户
export const getMerchantApi = (id: number) => {
  return defHttp.get({ url: '/pay/merchant/get?id=' + id })
}

// 根据商户名称搜索商户列表
export const getMerchantListByNameApi = (name: string) => {
  return defHttp.get({
    url: '/pay/merchant/list-by-name?id=',
    params: {
      name: name
    }
  })
}

// 新增支付商户
export const createMerchantApi = (data: MerchantVO) => {
  return defHttp.post({ url: '/pay/merchant/create', data })
}

// 修改支付商户
export const updateMerchantApi = (data: MerchantVO) => {
  return defHttp.put({ url: '/pay/merchant/update', data })
}

// 删除支付商户
export const deleteMerchantApi = (id: number) => {
  return defHttp.delete({ url: '/pay/merchant/delete?id=' + id })
}

// 导出支付商户
export const exportMerchantApi = (params: MerchantExportReqVO) => {
  return defHttp.download({ url: '/pay/merchant/export-excel', params })
}
// 支付商户状态修改
export const changeMerchantStatusApi = (id: number, status: number) => {
  const data = {
    id,
    status
  }
  return defHttp.put({ url: '/pay/merchant/update-status', data: data })
}
