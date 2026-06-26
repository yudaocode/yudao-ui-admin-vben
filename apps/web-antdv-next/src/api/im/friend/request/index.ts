import { requestClient } from '#/api/request';

export namespace ImFriendRequestApi {
  /** IM 好友申请 Response VO */
  export interface FriendRequestRespVO {
    id: number; // 申请编号
    fromUserId: number; // 发起方用户编号
    toUserId: number; // 接收方用户编号
    handleResult: number; // 处理结果；0=未处理；1=同意；2=拒绝
    applyContent?: string; // 申请理由
    handleContent?: string; // 处理理由（接收方拒绝时可选填）
    addSource?: number; // 添加来源；参见 ImFriendAddSourceEnum
    handleTime?: string; // 处理时间
    createTime: string; // 申请创建时间
    updateTime?: number; // 最近更新时间（毫秒时间戳，增量拉取游标用）
    fromNickname?: string; // 发起方昵称
    fromAvatar?: string; // 发起方头像
    toNickname?: string; // 接收方昵称
    toAvatar?: string; // 接收方头像
  }

  /** IM 好友申请发起 Request VO */
  export interface FriendRequestApplyReqVO {
    toUserId: number; // 接收方用户编号
    applyContent?: string; // 申请理由
    displayName?: string; // 对接收方的备注（仅自己可见）
    addSource?: number; // 添加来源
  }
}

/** 发起好友申请 */
export function applyFriendRequest(
  data: ImFriendRequestApi.FriendRequestApplyReqVO,
) {
  return requestClient.post<null | number>('/im/friend-request/apply', data);
}

/** 同意好友申请 */
export function agreeFriendRequest(id: number | string) {
  return requestClient.put<boolean>('/im/friend-request/agree', undefined, {
    params: { id },
  });
}

/** 拒绝好友申请 */
export function refuseFriendRequest(
  id: number | string,
  handleContent?: string,
) {
  return requestClient.put<boolean>('/im/friend-request/refuse', undefined, {
    params: { id, handleContent },
  });
}

/** 查询「我相关」的好友申请列表（游标分页：传 maxId 加载更多） */
export function getMyFriendRequestList(limit: number, maxId?: number) {
  const params: Record<string, number> = { limit };
  if (maxId !== null) {
    params.maxId = maxId;
  }
  return requestClient.get<ImFriendRequestApi.FriendRequestRespVO[]>(
    '/im/friend-request/list',
    { params },
  );
}

/** 增量拉取「我相关」的好友申请变更（重连 / 离线补偿） */
export function pullMyFriendRequestList(params: {
  lastId?: number;
  lastUpdateTime?: number;
  limit: number;
}) {
  return requestClient.get<ImFriendRequestApi.FriendRequestRespVO[]>(
    '/im/friend-request/pull',
    { params },
  );
}

/** 按 id 单查「我相关」的申请记录（带越权过滤；WebSocket 通知到达后用） */
export function getMyFriendRequest(id: number) {
  return requestClient.get<ImFriendRequestApi.FriendRequestRespVO | null>(
    '/im/friend-request/get',
    { params: { id } },
  );
}
