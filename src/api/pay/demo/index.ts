import { defHttp } from '@/utils/http/axios'

// 获得示例订单分页
export function getDemoOrderPage(params) {
  return defHttp.get({ url: '/pay/demo-order/page', params })
}

// 获得示例订单
export function getDemoOrder(id: number) {
  return defHttp.get({ url: `/pay/demo-order/get?id=${id}` })
}

// 创建示例订单
export function createDemoOrder(data) {
  return defHttp.post({ url: '/pay/demo-order/create', data })
}

// 退款示例订单
export function refundDemoOrder(id: number) {
  return defHttp.put({ url: `/pay/demo-order/refund?id=${id}` })
}
