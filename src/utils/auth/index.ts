import type { BasicKeys } from '@/utils/cache/persistent'
import { Persistent } from '@/utils/cache/persistent'
import { ACCESS_TOKEN_KEY, CacheTypeEnum, REFRESH_TOKEN_KEY, TENANT_ID_KEY } from '@/enums/cacheEnum'
import projectSetting from '@/settings/projectSetting'

const { permissionCacheType } = projectSetting
const isLocal = permissionCacheType === CacheTypeEnum.LOCAL

export function getAccessToken(): string {
  return getAuthCache(ACCESS_TOKEN_KEY)
}

export function setAccessToken(value: string) {
  return setAuthCache(ACCESS_TOKEN_KEY, value)
}

export function getRefreshToken(): string {
  return getAuthCache(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(value: string) {
  return setAuthCache(REFRESH_TOKEN_KEY, value)
}

export function getTenantId() {
  return getAuthCache(TENANT_ID_KEY)
}

export function setTenantId(value) {
  return setAuthCache(TENANT_ID_KEY, value)
}

export function getAuthCache<T>(key: BasicKeys) {
  const fn = isLocal ? Persistent.getLocal : Persistent.getSession
  return fn(key) as T
}

export function setAuthCache(key: BasicKeys, value) {
  const fn = isLocal ? Persistent.setLocal : Persistent.setSession
  return fn(key, value, true)
}

export function clearAuthCache(immediate = true) {
  const fn = isLocal ? Persistent.clearLocal : Persistent.clearSession
  return fn(immediate)
}
