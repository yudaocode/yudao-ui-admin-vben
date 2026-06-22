import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MemberUserApi {
  /** 会员用户信息 */
  export interface User {
    id?: number;
    avatar?: string;
    birthday?: number;
    createTime?: number;
    loginDate?: number;
    loginIp?: string;
    mark?: string;
    mobile?: string;
    email?: string;
    name?: string;
    nickname?: string;
    registerIp?: string;
    sex?: number;
    status?: number;
    areaId?: number;
    areaName?: string;
    tagIds?: number[];
    groupId?: number;
    levelId?: number;
    levelName?: null | string;
    point?: null | number;
    totalPoint?: null | number;
    experience?: null | number;
  }

  /** 会员用户等级更新信息 */
  export interface UserUpdateLevelReqVO {
    id: number;
    levelId: number;
    reason: string;
  }

  /** 会员用户积分更新信息 */
  export interface UserPointUpdateReqVO {
    id: number;
    point: number;
  }
}

/** 查询会员用户列表 */
export function getUserPage(params: PageParam) {
  return requestClient.get<PageResult<MemberUserApi.User>>(
    '/member/user/page',
    {
      params,
    },
  );
}

/** 查询会员用户详情 */
export function getUser(id: number) {
  return requestClient.get<MemberUserApi.User>(`/member/user/get?id=${id}`);
}

/** 修改会员用户 */
export function updateUser(data: MemberUserApi.User) {
  return requestClient.put('/member/user/update', data);
}

/** 修改会员用户等级 */
export function updateUserLevel(data: MemberUserApi.UserUpdateLevelReqVO) {
  return requestClient.put('/member/user/update-level', data);
}

/** 修改会员用户积分 */
export function updateUserPoint(data: MemberUserApi.UserPointUpdateReqVO) {
  return requestClient.put('/member/user/update-point', data);
}
