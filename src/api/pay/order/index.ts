import { defHttp } from '@/utils/http/axios'

export interface OrderVO {
  id: number
  merchantId: number
  appId: number
  channelId: number
  channelCode: string
  merchantOrderId: string
  subject: string
  body: string
  notifyUrl: string
  notifyStatus: number
  amount: number
  channelFeeRate: number
  channelFeeAmount: number
  status: number
  userIp: string
  expireTime: Date
  successTime: Date
  notifyTime: Date
  successExtensionId: number
  refundStatus: number
  refundTimes: number
  refundAmount: number
  channelUserId: string
  channelOrderNo: string
  createTime: Date
}

export interface OrderPageReqVO extends PageParam {
  merchantId?: number
  appId?: number
  channelId?: number
  channelCode?: string
  merchantOrderId?: string
  subject?: string
  body?: string
  notifyUrl?: string
  notifyStatus?: number
  amount?: number
  channelFeeRate?: number
  channelFeeAmount?: number
  status?: number
  expireTime?: Date[]
  successTime?: Date[]
  notifyTime?: Date[]
  successExtensionId?: number
  refundStatus?: number
  refundTimes?: number
  channelUserId?: string
  channelOrderNo?: string
  createTime?: Date[]
}

export interface OrderExportReqVO {
  merchantId?: number
  appId?: number
  channelId?: number
  channelCode?: string
  merchantOrderId?: string
  subject?: string
  body?: string
  notifyUrl?: string
  notifyStatus?: number
  amount?: number
  channelFeeRate?: number
  channelFeeAmount?: number
  status?: number
  expireTime?: Date[]
  successTime?: Date[]
  notifyTime?: Date[]
  successExtensionId?: number
  refundStatus?: number
  refundTimes?: number
  channelUserId?: string
  channelOrderNo?: string
  createTime?: Date[]
}

// 查询列表支付订单
export const getOrderPageApi = async (params: OrderPageReqVO) => {
  return defHttp.get({ url: '/pay/order/page', params })
}

// 查询详情支付订单
export const getOrderApi = async (id: number) => {
  return defHttp.get({ url: '/pay/order/get?id=' + id })
}

// 新增支付订单
export const createOrderApi = async (data: OrderVO) => {
  return defHttp.post({ url: '/pay/order/create', data })
}

// 修改支付订单
export const updateOrderApi = async (data: OrderVO) => {
  return defHttp.put({ url: '/pay/order/update', data })
}

// 删除支付订单
export const deleteOrderApi = async (id: number) => {
  return defHttp.delete({ url: '/pay/order/delete?id=' + id })
}

// 导出支付订单
export const exportOrderApi = async (params: OrderExportReqVO) => {
  return defHttp.download({ url: '/pay/order/export-excel', params })
}
