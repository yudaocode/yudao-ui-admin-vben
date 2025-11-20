import type { PageParam, PageResult } from '@vben/request';

import { MessageType } from '@vben/constants';

import { requestClient } from '#/api/request';

export namespace MpMessageApi {
  /** 消息信息 */
  export interface Message {
    id?: number;
    accountId: number;
    type: MessageType;
    openid: string;
    content: string;
    mediaId?: string;
    status: number;
    remark?: string;
    createTime?: Date;
  }

  /** 发送消息请求 */
  export interface MessageSendRequestVO {
    accountId: number;
    openid: string;
    type: MessageType;
    content: string;
    mediaId?: string;
  }
}

/** 查询消息列表 */
export function getMessagePage(params: PageParam) {
  return requestClient.get<PageResult<MpMessageApi.Message>>(
    '/mp/message/page',
    {
      params,
    },
  );
}

/** 发送消息 */
export function sendMessage(data: MpMessageApi.MessageSendRequestVO) {
  return requestClient.post('/mp/message/send', data);
}
