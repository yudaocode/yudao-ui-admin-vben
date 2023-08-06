import { defHttp } from '@/utils/http/axios'

export interface OAuth2ClientVO {
  id: number
  clientId: string
  secret: string
  name: string
  logo: string
  description: string
  status: number
  accessTokenValiditySeconds: number
  refreshTokenValiditySeconds: number
  redirectUris: string[]
  autoApprove: boolean
  authorizedGrantTypes: string[]
  scopes: string[]
  authorities: string[]
  resourceIds: string[]
  additionalInformation: string
  isAdditionalInformationJson: boolean
  createTime: Date
}

export interface OAuth2ClientPageReqVO extends PageParam {
  name?: string
  status?: number
}
// 查询 OAuth2列表
export function getOAuth2ClientPage(params: OAuth2ClientPageReqVO) {
  return defHttp.get({ url: '/system/oauth2-client/page', params })
}

// 查询 OAuth2详情
export function getOAuth2Client(id: number) {
  return defHttp.get({ url: `/system/oauth2-client/get?id=${id}` })
}

// 新增 OAuth2
export function createOAuth2Client(data: OAuth2ClientVO) {
  return defHttp.post({ url: '/system/oauth2-client/create', data })
}

// 修改 OAuth2
export function updateOAuth2Client(data: OAuth2ClientVO) {
  return defHttp.put({ url: '/system/oauth2-client/update', data })
}

// 删除 OAuth2
export function deleteOAuth2Client(id: number) {
  return defHttp.delete({ url: `/system/oauth2-client/delete?id=${id}` })
}
