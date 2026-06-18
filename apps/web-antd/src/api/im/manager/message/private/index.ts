import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerPrivateMessageApi {
  /** 私聊消息 */
  export interface PrivateMessage {
    id: number;
    clientMessageId?: string;
    senderId: number;
    senderNickname?: string;
    receiverId: number;
    receiverNickname?: string;
    type: number;
    content: string;
    status: number;
    receiptStatus?: number;
    sendTime: Date;
    createTime: Date;
  }
}


/** 获得私聊消息分页 */
export function getManagerPrivateMessagePage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerPrivateMessageApi.PrivateMessage>>(
    '/im/manager/message/private/page',
    { params },
  );
}

/** 获得私聊消息详情 */
export function getManagerPrivateMessage(id: number) {
  return requestClient.get<ImManagerPrivateMessageApi.PrivateMessage>(
    '/im/manager/message/private/get',
    { params: { id } },
  );
}
