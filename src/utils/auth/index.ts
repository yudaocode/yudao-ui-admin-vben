import { Persistent, BasicKeys } from '@/utils/cache/persistent'
import { CacheTypeEnum } from '@/enums/cacheEnum'
import projectSetting from '@/settings/projectSetting'
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, TENANT_ID_KEY } from '@/enums/cacheEnum'

const { permissionCacheType } = projectSetting
const isLocal = permissionCacheType === CacheTypeEnum.LOCAL

export function getAccessToken() {
  return getAuthCache(ACCESS_TOKEN_KEY)
}

export function setAccessToken(value) {
  return setAuthCache(ACCESS_TOKEN_KEY, value)
}

export function getRefreshToken() {
  return getAuthCache(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(value) {
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
