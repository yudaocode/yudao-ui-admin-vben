import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerGroupMessageApi {
  /** 群聊消息 */
  export interface GroupMessage {
    id: number;
    clientMessageId?: string;
    groupId: number;
    groupName?: string;
    senderId: number;
    senderNickname?: string;
    type: number;
    content: string;
    status: number;
    atUserIds?: number[];
    atUserNicknames?: (null | string)[];
    receiptStatus: number;
    sendTime: Date;
    createTime: Date;
  }
}

/** 获得群聊消息分页 */
export function getManagerGroupMessagePage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerGroupMessageApi.GroupMessage>>(
    '/im/manager/message/group/page',
    { params },
  );
}

/** 获得群聊消息详情 */
export function getManagerGroupMessage(id: number) {
  return requestClient.get<ImManagerGroupMessageApi.GroupMessage>(
    '/im/manager/message/group/get',
    { params: { id } },
  );
}
