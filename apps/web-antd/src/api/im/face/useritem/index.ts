import { requestClient } from '#/api/request'

// 个人表情
export interface ImFaceUserItemVO {
  id: number
  url: string
  name?: string
  width: number
  height: number
}

// 添加个人表情请求
export interface ImFaceUserItemSaveReqVO {
  url: string
  name?: string
  width: number
  height: number
}

// 获取我的个人表情列表
export const getFaceUserItemList = () => {
  return requestClient.get<ImFaceUserItemVO[]>('/im/face-user-item/list')
}

// 添加个人表情
export const createFaceUserItem = (data: ImFaceUserItemSaveReqVO) => {
  return requestClient.post<number>('/im/face-user-item/create', data)
}

// 删除个人表情
export const deleteFaceUserItem = (id: number) => {
  return requestClient.delete('/im/face-user-item/delete', { params: { id } })
}
