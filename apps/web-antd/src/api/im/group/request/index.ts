import { requestClient } from '#/api/request';

export namespace ImGroupRequestApi {
  /** IM 加群申请 Response VO */
  export interface GroupRequestRespVO {
    id: number; // 申请编号
    groupId: number; // 群编号
    userId: number; // 申请人 / 被邀请人用户编号
    inviterUserId?: number; // 邀请人；NULL 表示用户主动申请
    handleResult: number; // 处理结果；0=未处理；1=同意；2=拒绝
    applyContent?: string; // 申请理由
    handleContent?: string; // 处理理由（拒绝时可选填）
    handleUserId?: number; // 处理人用户编号
    addSource?: number; // 加入来源；参见 ImGroupAddSourceEnum
    handleTime?: string; // 处理时间
    createTime: string; // 申请创建时间
    updateTime?: number; // 最近更新时间（毫秒时间戳，增量拉取游标用）
    userNickname?: string; // 申请人 / 被邀请人昵称
    userAvatar?: string; // 申请人 / 被邀请人头像
    inviterNickname?: string; // 邀请人昵称
    inviterAvatar?: string; // 邀请人头像
    groupName?: string; // 群名称
    groupAvatar?: string; // 群头像
  }

  /** IM 加群申请发起 Request VO */
  export interface GroupRequestApplyReqVO {
    groupId: number; // 群编号
    applyContent?: string; // 申请理由
    addSource?: number; // 加入来源
  }
}


/** 申请加群 */
export function applyJoinGroup(data: ImGroupRequestApi.GroupRequestApplyReqVO) {
  return requestClient.post<null | number>('/im/group-request/apply', data);
}

/** 同意加群申请（群主或管理员） */
export function agreeGroupRequest(id: number | string) {
  return requestClient.put<boolean>('/im/group-request/agree', undefined, {
    params: { id },
  });
}

/** 拒绝加群申请（群主或管理员） */
export function refuseGroupRequest(
  id: number | string,
  handleContent?: string,
) {
  return requestClient.put<boolean>('/im/group-request/refuse', undefined, {
    params: { id, handleContent },
  });
}

/** 查询「我管理的所有群」下的未处理加群申请列表（不分页）；前端 store 据此派生横幅红点 + Drawer 列表 */
export function getUnhandledRequestList() {
  return requestClient.get<ImGroupRequestApi.GroupRequestRespVO[]>(
    '/im/group-request/unhandled-list',
  );
}

/** 查询指定群下的全部加群申请（含已处理）；仅群主 / 管理员可查 */
export function getGroupRequestListByGroupId(groupId: number) {
  return requestClient.get<ImGroupRequestApi.GroupRequestRespVO[]>(
    '/im/group-request/list-by-group',
    { params: { groupId } },
  );
}

/** 按 id 单查申请记录（带越权过滤；WebSocket 通知到达后用） */
export function getMyGroupRequest(id: number) {
  return requestClient.get<ImGroupRequestApi.GroupRequestRespVO | null>(
    '/im/group-request/get',
    { params: { id } },
  );
}

/** 增量拉取我管理的所有群下加群申请变更（重连 / 离线补偿） */
export function pullMyGroupRequestList(params: {
  lastId?: number;
  lastUpdateTime?: number;
  limit: number;
}) {
  return requestClient.get<ImGroupRequestApi.GroupRequestRespVO[]>(
    '/im/group-request/pull',
    { params },
  );
}
