import { requestClient } from '#/api/request'

// 用户端表情包项（精简版）
export interface ImFacePackUserItemVO {
  id: number
  url: string
  name?: string
  width: number
  height: number
}

// 用户端表情包 + 嵌套 items
export interface ImFacePackUserVO {
  id: number
  name: string
  icon?: string
  items: ImFacePackUserItemVO[]
}

// 拉取所有启用的系统表情包（含表情列表）
export const getFacePackList = () => {
  return requestClient.get<ImFacePackUserVO[]>('/im/face-pack/list')
}
