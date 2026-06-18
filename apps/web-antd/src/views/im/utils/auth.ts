import { useAccessStore, useUserStore } from '@vben/stores'

// TODO @AI：是不是换成 vben 里更合适的方法；

/** 获取当前用户编号 */
export function getCurrentUserId(): number {
  const userInfo = useUserStore().userInfo
  return Number(userInfo?.id ?? userInfo?.userId ?? 0)
}

/** 获取刷新令牌 */
export function getRefreshToken(): null | string {
  return useAccessStore().refreshToken
}
