// TODO @AI：vben 有内置的，不用这么搞；
import type { SystemUserApi } from '#/api/system/user'

import { requestClient } from '#/api/request'
import { getSimpleUserList as getVbenSimpleUserList } from '#/api/system/user'

export type UserVO = SystemUserApi.User & {
  deptName?: string
  id: number
  loginDate?: Date
}

/** 获取用户精简信息列表 */
export function getSimpleUserList(): Promise<UserVO[]> {
  return getVbenSimpleUserList() as Promise<UserVO[]>
}

/** 按用户编号查询用户精简信息 */
export function getSimpleUser(id: number | string) {
  return requestClient.get<UserVO>('/system/user/get-simple', {
    params: { id }
  })
}

/** 按昵称模糊搜索用户 */
export function getSimpleUserListByNickname(nickname: string) {
  return requestClient.get<UserVO[]>('/system/user/list-by-nickname', {
    params: { nickname }
  })
}
