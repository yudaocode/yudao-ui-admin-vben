import { requestClient } from '#/api/request'

// 群聊消息 Response VO
export interface ImGroupMessageRespVO {
  id: number // 消息编号
  clientMessageId: string // 客户端消息编号
  senderId: number // 发送人编号
  groupId: number // 群编号
  type: number // 内容类型
  content: string // 消息内容（JSON 格式）
  status: number // 消息状态
  sendTime: string // 发送时间
  atUserIds?: number[] // @ 目标用户编号列表
  receiverUserIds?: number[] // 定向接收用户编号列表
  receiptStatus?: number // 回执状态
  readCount?: number // 已读人数（回执消息、且发送人为当前用户时有值）
}

// 群聊消息发送 Request VO
export interface ImGroupMessageSendReqVO {
  clientMessageId: string // 客户端消息编号
  groupId: number // 群编号
  type: number // 内容类型
  content: string // 消息内容（JSON 格式）
  atUserIds?: number[] // @ 目标用户编号列表
  receipt?: boolean // 是否需要回执
}

// 群聊历史消息列表 Request VO
export interface ImGroupMessageListReqVO {
  groupId: number | string // 群编号
  maxId?: number | string // 起始消息编号（不含），为空则从最新消息开始
  limit: number // 拉取数量（1 ~ 200）
}

// 发送群聊消息
export const sendGroupMessage = (data: ImGroupMessageSendReqVO) => {
  return requestClient.post<ImGroupMessageRespVO>('/im/message/group/send', data)
}

// 拉取群聊消息（增量）
export const pullGroupMessages = (
  params: { minId: number | string; size: number },
  signal?: AbortSignal
) => {
  return requestClient.get<ImGroupMessageRespVO[]>('/im/message/group/pull', { params, signal })
}

// 查询群聊历史消息
export const getGroupMessageList = (params: ImGroupMessageListReqVO) => {
  return requestClient.get<ImGroupMessageRespVO[]>('/im/message/group/list', { params })
}

// 标记群聊消息已读
export const readGroupMessages = (groupId: number | string, messageId: number | string) => {
  return requestClient.put<boolean>('/im/message/group/read', undefined, { params: { groupId, messageId } })
}

// 撤回群聊消息
export const recallGroupMessage = (id: number | string) => {
  return requestClient.delete<ImGroupMessageRespVO>('/im/message/group/recall', { params: { id } })
}

// 获取群消息已读用户列表
export const getGroupReadUsers = (params: {
  groupId: number | string
  messageId: number | string
}) => {
  return requestClient.get<number[]>('/im/message/group/get-read-user-ids', { params })
}
