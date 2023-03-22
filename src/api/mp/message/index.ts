import { defHttp } from '@/utils/http/axios'

// 获得公众号消息分页
export const getMessagePage = (params) => {
  return defHttp.get({ url: '/mp/message/page', params })
}

// 给粉丝发送消息
export const sendMessage = (data) => {
  return defHttp.post({ url: '/mp/message/send', data })
}
