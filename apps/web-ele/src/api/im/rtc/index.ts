import { requestClient } from '#/api/request';

export namespace ImRtcApi {
  /** 创建新通话请求 VO */
  export interface RtcCallCreateReqVO {
    conversationType: number;
    mediaType: number;
    groupId?: number;
    inviteeIds: number[]; // 被邀请的用户编号集合；私聊必传 1 个对端，群聊必传至少 1 人
  }

  /** 通话中追加邀请请求 VO；仅群通话可用 */
  export interface RtcCallInviteReqVO {
    room: string;
    inviteeIds: number[];
  }

  /** 通话会话 VO；create / join / accept / refreshToken 共用 */
  export interface RtcCallRespVO {
    room: string; // 业务通话编号（同时作为 LiveKit 房间名）
    livekitUrl: string;
    token?: string; // ENDED 状态时为 null（无需 connect LiveKit）
    conversationType: number;
    mediaType: number;
    status: number;
    endReason?: number; // 结束原因；仅 status=ENDED 时有值
    inviterId: number;
    groupId?: number;
    inviteeIds?: number[];
    joinedUserIds?: number[];
  }

  /** 群活跃通话查询响应；不含 token */
  export interface RtcGroupCallRespVO {
    room: string;
    groupId: number;
    mediaType: number;
    inviterId: number;
    joinedUserIds?: number[];
    inviteeIds?: number[];
  }
}

/** 创建新通话；私聊或群聊根据 conversationType 区分 */
export function createCall(data: ImRtcApi.RtcCallCreateReqVO) {
  return requestClient.post<ImRtcApi.RtcCallRespVO>('/im/rtc/create', data);
}

/** 通话中追加邀请；仅群通话可用 */
export function inviteCall(data: ImRtcApi.RtcCallInviteReqVO) {
  return requestClient.post<boolean>('/im/rtc/invite', data);
}

/** 加入已有群通话；用于胶囊条「加入」按钮 */
export function joinCall(room: string) {
  return requestClient.post<ImRtcApi.RtcCallRespVO>('/im/rtc/join', undefined, {
    params: { room },
  });
}

/** 接听通话 */
export function acceptCall(room: string) {
  return requestClient.post<ImRtcApi.RtcCallRespVO>(
    '/im/rtc/accept',
    undefined,
    {
      params: { room },
    },
  );
}

/** 拒绝通话 */
export function rejectCall(room: string) {
  return requestClient.post<boolean>('/im/rtc/reject', undefined, {
    params: { room },
  });
}

/** 取消邀请；主叫接通前调用 */
export function cancelCall(room: string) {
  return requestClient.post<boolean>('/im/rtc/cancel', undefined, {
    params: { room },
  });
}

/** 离开通话；接通后调用 */
export function leaveCall(room: string) {
  return requestClient.post<boolean>('/im/rtc/leave', undefined, {
    params: { room },
  });
}

/** 振铃超时检查；RUNNING 端 timer 兜底，触发后端立即扫描该 room 的超时 INVITING（接口静默） */
export function noAnswerCallCheck(room: string) {
  return requestClient.post<boolean>(
    '/im/rtc/no-answer-call-check',
    undefined,
    { params: { room } },
  );
}

/** 查询当前进行中的通话；目前仅群聊场景（胶囊条），返回 null 表示无活跃通话 */
export function getActiveCall(groupId: number) {
  return requestClient.get<ImRtcApi.RtcGroupCallRespVO | null>(
    '/im/rtc/get-active-call',
    { params: { groupId } },
  );
}
