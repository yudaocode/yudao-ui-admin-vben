import { defHttp } from '@/utils/http/axios'

export interface ChannelVO {
  id: number
  code: string
  config: string
  status: number
  remark: string
  feeRate: number
  merchantId: number
  appId: number
  createTime: Date
}

export interface ChannelPageReqVO extends PageParam {
  code?: string
  status?: number
  remark?: string
  feeRate?: number
  merchantId?: number
  appId?: number
  config?: string
  createTime?: Date[]
}

export interface ChannelExportReqVO {
  code?: string
  status?: number
  remark?: string
  feeRate?: number
  merchantId?: number
  appId?: number
  config?: string
  createTime?: Date[]
}

// 查询列表支付渠道
export const getChannelPageApi = (params: ChannelPageReqVO) => {
  return defHttp.get({ url: '/pay/channel/page', params })
}

// 查询详情支付渠道
export const getChannelApi = (merchantId: number, appId: string, code: string) => {
  const params = {
    merchantId: merchantId,
    appId: appId,
    code: code
  }
  return defHttp.get({ url: '/pay/channel/get-channel', params: params })
}

// 新增支付渠道
export const createChannelApi = (data: ChannelVO) => {
  return defHttp.post({ url: '/pay/channel/create', data })
}

// 修改支付渠道
export const updateChannelApi = (data: ChannelVO) => {
  return defHttp.put({ url: '/pay/channel/update', data })
}

// 删除支付渠道
export const deleteChannelApi = (id: number) => {
  return defHttp.delete({ url: '/pay/channel/delete?id=' + id })
}

// 导出支付渠道
export const exportChannelApi = (params: ChannelExportReqVO) => {
  return defHttp.download({ url: '/pay/channel/export-excel', params })
}
