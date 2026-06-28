import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerGroupRequestApi {
  /** 加群申请 */
  export interface GroupRequest {
    id: number;
    groupId: number;
    groupName?: string;
    userId: number;
    userNickname?: string;
    inviterUserId?: number;
    inviterNickname?: string;
    applyContent?: string;
    addSource?: number;
    handleResult: number;
    handleUserId?: number;
    handleNickname?: string;
    handleContent?: string;
    handleTime?: Date;
    createTime: Date;
  }
}

/** 获得加群申请分页 */
export function getManagerGroupRequestPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerGroupRequestApi.GroupRequest>>(
    '/im/manager/group-request/page',
    { params },
  );
}
