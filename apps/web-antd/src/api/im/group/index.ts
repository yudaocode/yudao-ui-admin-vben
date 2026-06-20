import type { ImGroupMessageApi } from '#/api/im/message/group';

import { requestClient } from '#/api/request';

export namespace ImGroupApi {
  /** 群 Response VO */
  export interface GroupRespVO {
    id: number; // 编号
    name: string; // 群名称
    ownerUserId: number; // 群主用户编号
    avatar?: string; // 群头像
    notice?: string; // 群公告
    banned?: boolean; // 是否封禁
    mutedAll?: boolean; // 是否全群禁言
    joinApproval?: boolean; // 进群是否需群主 / 管理员审批
    bannedTime?: string; // 封禁时间
    status: number; // 群状态（0=正常，1=已解散）
    dissolvedTime?: string; // 解散时间
    createTime?: string; // 创建时间
    pinnedMessages?: ImGroupMessageApi.GroupMessageRespVO[]; // 群置顶消息列表（后端关联回填，仅当登录用户是群成员时非空）
    joinStatus?: number; // 当前登录用户在该群的成员状态（参见 CommonStatusEnum：0 在群 / 1 已退群）；历史退群群仍返回，供展示离线消息的群名 / 头像
    groupRemark?: string; // 当前登录用户对该群的备注
    silent?: boolean; // 当前登录用户是否免打扰
  }

  /** 群消息置顶 / 取消置顶 Request VO */
  export interface GroupMessagePinReqVO {
    id: number; // 群编号
    messageId: number; // 消息编号
  }

  /** 群创建 Request VO */
  export interface GroupCreateReqVO {
    name: string; // 群名称
    memberUserIds?: number[]; // 初始成员用户编号列表（建群同时邀请的好友，不含创建者自己）
    joinApproval?: boolean; // 进群是否需审批；不传默认 false 自由进群
  }

  /** 群更新 Request VO */
  export interface GroupUpdateReqVO {
    id: number; // 群编号
    name?: string; // 群名称
    avatar?: string; // 群头像
    notice?: string; // 群公告
    joinApproval?: boolean; // 进群是否需审批
  }

  /** 添加 / 撤销群管理员 Request VO */
  export interface GroupAdminReqVO {
    id: number; // 群编号
    userIds: number[]; // 目标用户编号列表
  }

  /** 群主转让 Request VO */
  export interface GroupTransferOwnerReqVO {
    id: number; // 群编号
    newOwnerUserId: number; // 新群主用户编号
  }

  /** 全群禁言 / 取消 Request VO */
  export interface GroupMuteAllReqVO {
    id: number; // 群编号
    mutedAll: boolean; // 是否全群禁言
  }

  /** 成员禁言 Request VO */
  export interface GroupMuteMemberReqVO {
    id: number; // 群编号
    userId: number; // 被禁言的用户编号
    mutedSeconds: number; // 禁言时长（秒），0 表示永久禁言
  }

  /** 取消成员禁言 Request VO */
  export interface GroupCancelMuteMemberReqVO {
    id: number; // 群编号
    userId: number; // 被取消禁言的用户编号
  }
}


/** 获得当前登录用户的群列表 */
export function getMyGroupList() {
  return requestClient.get<ImGroupApi.GroupRespVO[]>('/im/group/list');
}

/** 获得群详情 */
export function getGroup(id: number | string) {
  return requestClient.get<ImGroupApi.GroupRespVO>('/im/group/get', { params: { id } });
}

/** 创建群 */
export function createGroup(data: ImGroupApi.GroupCreateReqVO) {
  return requestClient.post<ImGroupApi.GroupRespVO>('/im/group/create', data);
}

/** 更新群 */
export function updateGroup(data: ImGroupApi.GroupUpdateReqVO) {
  return requestClient.put<ImGroupApi.GroupRespVO>('/im/group/update', data);
}

/** 解散群 */
export function dissolveGroup(id: number | string) {
  return requestClient.delete<boolean>('/im/group/dissolve', {
    params: { id },
  });
}

/** 添加群管理员（仅群主可调） */
export function addGroupAdmin(data: ImGroupApi.GroupAdminReqVO) {
  return requestClient.put<boolean>('/im/group/add-admin', data);
}

/** 撤销群管理员（仅群主可调） */
export function removeGroupAdmin(data: ImGroupApi.GroupAdminReqVO) {
  return requestClient.put<boolean>('/im/group/remove-admin', data);
}

/** 转让群主（仅老群主可调；旧群主转让后降为普通成员） */
export function transferGroupOwner(data: ImGroupApi.GroupTransferOwnerReqVO) {
  return requestClient.put<boolean>('/im/group/transfer-owner', data);
}

/** 置顶群消息（仅群主 / 管理员可调） */
export function pinGroupMessage(data: ImGroupApi.GroupMessagePinReqVO) {
  return requestClient.put<boolean>('/im/group/pin-message', data);
}

/** 取消置顶群消息（仅群主 / 管理员可调） */
export function unpinGroupMessage(data: ImGroupApi.GroupMessagePinReqVO) {
  return requestClient.put<boolean>('/im/group/unpin-message', data);
}

/** 全群禁言 / 取消（仅群主 / 管理员可调） */
export function muteAll(data: ImGroupApi.GroupMuteAllReqVO) {
  return requestClient.put<boolean>('/im/group/mute-all', data);
}

/** 禁言成员 */
export function muteMember(data: ImGroupApi.GroupMuteMemberReqVO) {
  return requestClient.put<boolean>('/im/group/mute-member', data);
}

/** 取消成员禁言 */
export function cancelMuteMember(data: ImGroupApi.GroupCancelMuteMemberReqVO) {
  return requestClient.put<boolean>('/im/group/cancel-mute-member', data);
}
