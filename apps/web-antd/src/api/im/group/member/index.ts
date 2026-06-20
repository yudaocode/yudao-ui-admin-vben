import { requestClient } from '#/api/request';

export namespace ImGroupMemberApi {
  /** 群成员 Response VO */
  export interface GroupMemberRespVO {
    id: number; // 编号
    groupId: number; // 群编号
    userId: number; // 用户编号
    displayUserName?: string; // 组内显示名（群主设置的备注）
    groupRemark?: string; // 群备注（当前用户对群的备注）
    silent?: boolean; // 是否免打扰
    status?: number; // 成员状态（0=在群，1=退群）
    role?: number; // 成员角色，参见 ImGroupMemberRole 枚举
    joinTime?: string; // 入群时间
    quitTime?: string; // 退群时间
    muteEndTime?: string; // 禁言到期时间
    createTime?: string; // 创建时间
    nickname?: string; // 用户昵称
    avatar?: string; // 用户头像
  }

  /** 群成员邀请 Request VO */
  export interface GroupMemberInviteReqVO {
    groupId: number; // 群编号
    memberUserIds: number[]; // 被邀请的用户编号列表
  }

  /** 群成员移除 Request VO */
  export interface GroupMemberRemoveReqVO {
    groupId: number; // 群编号
    memberUserIds: number[]; // 被移除的用户编号列表
  }

  /** 群成员更新 Request VO */
  export interface GroupMemberUpdateReqVO {
    groupId: number; // 群编号
    displayUserName?: string; // 群内昵称
    groupRemark?: string; // 群备注
    silent?: boolean; // 是否免打扰
  }
}


/** 邀请用户加入群 */
export function inviteGroupMember(data: ImGroupMemberApi.GroupMemberInviteReqVO) {
  return requestClient.post<boolean>('/im/group/invite', data);
}

/** 退出群 */
export function quitGroup(groupId: number | string) {
  return requestClient.delete<boolean>('/im/group/quit', {
    params: { groupId },
  });
}

/** 移除群成员 */
export function removeGroupMember(data: ImGroupMemberApi.GroupMemberRemoveReqVO) {
  return requestClient.delete<boolean>('/im/group/kicking', { data });
}

/** 获得群成员详情 */
export function getGroupMember(groupId: number, userId: number) {
  return requestClient.get<ImGroupMemberApi.GroupMemberRespVO>('/im/group-member/get', {
    params: { groupId, userId },
  });
}

/** 获得指定群的成员列表（聚合 AdminUser 昵称 / 头像） */
export function getGroupMemberList(groupId: number | string) {
  return requestClient.get<ImGroupMemberApi.GroupMemberRespVO[]>('/im/group-member/list', {
    params: { groupId },
  });
}

/** 更新群成员 */
export function updateGroupMember(data: ImGroupMemberApi.GroupMemberUpdateReqVO) {
  return requestClient.put<boolean>('/im/group-member/update', data);
}
