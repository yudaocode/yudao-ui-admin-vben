import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerRtcApi {
  /** RTC 通话 */
  export interface RtcCall {
    id: number;
    room: string;
    conversationType: number;
    mediaType: number;
    inviterUserId: number;
    inviterNickname?: string;
    groupId?: number;
    groupName?: string;
    status: number;
    endReason?: number;
    startTime: Date;
    acceptTime?: Date;
    endTime?: Date;
    createTime: Date;
  }

  /** RTC 通话参与者 */
  export interface RtcParticipant {
    id: number;
    callId: number;
    userId: number;
    userNickname?: string;
    role: number;
    status: number;
    inviteTime: Date;
    acceptTime?: Date;
    leaveTime?: Date;
  }
}


/** 获得通话记录分页 */
export function getManagerRtcCallPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerRtcApi.RtcCall>>(
    '/im/manager/rtc/page',
    { params },
  );
}

/** 获得通话参与者列表 */
export function getManagerRtcCallParticipantList(id: number) {
  return requestClient.get<ImManagerRtcApi.RtcParticipant[]>(
    '/im/manager/rtc/participant-list',
    { params: { id } },
  );
}
