import { useAccessStore, useUserStore } from '@vben/stores'

// TODO DONE @AI：已使用 Vben 的 useUserStore / useAccessStore 获取登录信息；

/** 获取当前用户编号 */
export function getCurrentUserId(): number {
  const userInfo = useUserStore().userInfo
  return Number(userInfo?.id ?? userInfo?.userId ?? 0)
}

/** 获取刷新令牌 */
export function getRefreshToken(): null | string {
  return useAccessStore().refreshToken
}
