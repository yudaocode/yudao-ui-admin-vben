import { defHttp } from '@/utils/http/axios'

export interface OAuth2TokenVO {
  id: number
  accessToken: string
  refreshToken: string
  userId: number
  userType: number
  clientId: string
  createTime: Date
  expiresTime: Date
}

export interface OAuth2TokenPageReqVO extends PageParam {
  userId?: number
  userType?: number
  clientId?: string
}

// 查询 token列表
export const getAccessTokenPageApi = (params: OAuth2TokenPageReqVO) => {
  return defHttp.get({ url: '/system/oauth2-token/page', params })
}

// 删除 token
export const deleteAccessTokenApi = (accessToken: number) => {
  return defHttp.delete({ url: '/system/oauth2-token/delete?accessToken=' + accessToken })
}
