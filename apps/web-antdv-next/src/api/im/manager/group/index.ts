import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace ImManagerGroupApi {
  /** 群 */
  export interface Group {
    id: number;
    name: string;
    avatar?: string;
    notice?: string;
    ownerUserId: number;
    ownerNickname?: string;
    memberCount?: number;
    status: number;
    banned: boolean;
    mutedAll?: boolean; // 是否全群禁言
    bannedReason?: string;
    bannedTime?: Date;
    dissolvedTime?: Date;
    createTime: Date;
  }

  /** 群成员 */
  export interface GroupMember {
    userId: number;
    nickname?: string;
    avatar?: string;
    displayUserName?: string;
    groupRemark?: string;
    silent?: boolean;
    status: number;
    role?: number; // 成员角色，参见 ImGroupMemberRole 枚举
    joinTime?: Date;
    quitTime?: Date;
    muteEndTime?: Date; // 禁言到期时间
  }

  /** 群封禁请求 */
  export interface GroupBanReqVO {
    id: number;
    reason: string;
  }
}


/** 获得群分页 */
export function getManagerGroupPage(params: PageParam) {
  return requestClient.get<PageResult<ImManagerGroupApi.Group>>(
    '/im/manager/group/page',
    { params },
  );
}

/** 获得群详情 */
export function getManagerGroup(id: number) {
  return requestClient.get<ImManagerGroupApi.Group>('/im/manager/group/get', {
    params: { id },
  });
}

/** 封禁群 */
export function banManagerGroup(data: ImManagerGroupApi.GroupBanReqVO) {
  return requestClient.put<boolean>('/im/manager/group/ban', data);
}

/** 解封群 */
export function unbanManagerGroup(id: number) {
  return requestClient.put<boolean>('/im/manager/group/unban', undefined, {
    params: { id },
  });
}

/** 解散群 */
export function dissolveManagerGroup(id: number) {
  return requestClient.delete<boolean>('/im/manager/group/dissolve', {
    params: { id },
  });
}

/** 获得群成员列表（含已退群成员，由前端按需过滤） */
export function getManagerGroupMemberList(groupId: number) {
  return requestClient.get<ImManagerGroupApi.GroupMember[]>(
    '/im/manager/group/member/list',
    { params: { groupId } },
  );
}
