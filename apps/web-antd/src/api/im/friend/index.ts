import { requestClient } from '#/api/request';

export namespace ImFriendApi {
  /** IM 好友 Response VO */
  export interface FriendRespVO {
    id: number; // 关系记录编号
    friendUserId: number; // 好友的用户编号
    silent?: boolean; // 是否免打扰
    displayName?: string; // 好友展示备注（仅自己可见）
    displayNamePinyin?: string; // 备注的拼音（小写无空格，前端按首字母分桶 / 拼音搜索）
    addSource?: number; // 添加来源；参见 ImFriendAddSourceEnum
    pinned?: boolean; // 是否置顶联系人
    blocked?: boolean; // 是否拉黑
    status?: number; // 好友状态（0=正常，1=已删除）
    addTime?: string; // 添加好友时间
    deleteTime?: string; // 删除好友时间
    updateTime?: number; // 最近更新时间（毫秒时间戳，增量拉取游标用）
    nickname?: string; // 好友昵称
    nicknamePinyin?: string; // 昵称的拼音（小写无空格，前端按首字母分桶 / 拼音搜索）
    avatar?: string; // 好友头像
  }

  /** IM 好友更新 Request VO */
  export interface FriendUpdateReqVO {
    friendUserId: number; // 好友的用户编号
    silent?: boolean; // 是否免打扰
    displayName?: string; // 好友展示备注
    pinned?: boolean; // 是否置顶联系人
  }
}


/** 获得当前登录用户的好友列表 */
export function getMyFriendList() {
  return requestClient.get<ImFriendApi.FriendRespVO[]>('/im/friend/list');
}

/** 增量拉取当前用户的好友关系（重连 / 离线补偿） */
export function pullMyFriendList(params: {
  lastId?: number;
  lastUpdateTime?: number;
  limit: number;
}) {
  return requestClient.get<ImFriendApi.FriendRespVO[]>('/im/friend/pull', { params });
}

/** 获得好友详情 */
export function getFriend(friendUserId: number | string) {
  return requestClient.get<ImFriendApi.FriendRespVO>('/im/friend/get', {
    params: { friendUserId },
  });
}

/** 删除好友（单向软删除） */
export function deleteFriend(friendUserId: number | string, clear: boolean) {
  return requestClient.delete<boolean>('/im/friend/delete', {
    params: { friendUserId, clear },
  });
}

/** 更新好友信息（备注 / 免打扰 / 联系人置顶） */
export function updateFriend(data: ImFriendApi.FriendUpdateReqVO) {
  return requestClient.put<boolean>('/im/friend/update', data);
}

/** 拉黑好友（必须先是好友；单边屏蔽对方私聊消息） */
export function blockFriend(friendUserId: number | string) {
  return requestClient.put<boolean>('/im/friend/block', undefined, {
    params: { friendUserId },
  });
}

/** 移出黑名单 */
export function unblockFriend(friendUserId: number | string) {
  return requestClient.put<boolean>('/im/friend/unblock', undefined, {
    params: { friendUserId },
  });
}
