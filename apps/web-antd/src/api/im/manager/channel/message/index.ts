import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerChannelMessageApi {
  /** 频道消息 */
  export interface ChannelMessage {
    id: number;
    channelId: number;
    channelName?: string;
    materialId: number;
    materialTitle?: string;
    materialCoverUrl?: string;
    type: number;
    content?: string;
    receiverUserIds?: number[];
    sendTime?: Date;
  }

  /** 频道消息发送请求 */
  export interface ChannelMessageSendReqVO {
    materialId: number;
    receiverUserIds?: number[];
  }
}


/** 立即推送频道消息 */
export function sendManagerChannelMessage(
  data: ImManagerChannelMessageApi.ChannelMessageSendReqVO,
) {
  return requestClient.post<number>('/im/manager/channel-message/send', data);
}

/** 删除频道消息 */
export function deleteManagerChannelMessage(id: number) {
  return requestClient.delete<boolean>('/im/manager/channel-message/delete', {
    params: { id },
  });
}

/** 获得频道消息分页 */
export function getManagerChannelMessagePage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerChannelMessageApi.ChannelMessage>>(
    '/im/manager/channel-message/page',
    { params },
  );
}
