import { StorageManager } from '@vben/utils';
// token key
const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN__';

const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN__';

const TENANT_ID_KEY = 'TENANT_ID__';

const storage = new StorageManager({
  prefix: import.meta.env.VITE_APP_NAMESPACE,
  storageType: 'sessionStorage',
});

function getAccessToken(): null | string {
  return storage.getItem(ACCESS_TOKEN_KEY);
}

function setAccessToken(value: string, unix: number) {
  return storage.setItem(ACCESS_TOKEN_KEY, value, unix - Date.now());
}

function getRefreshToken(): null | string {
  return storage.getItem(REFRESH_TOKEN_KEY);
}

function setRefreshToken(value: string) {
  return storage.setItem(REFRESH_TOKEN_KEY, value);
}

function getTenantId(): null | number {
  return storage.getItem(TENANT_ID_KEY);
}

function setTenantId(value: number) {
  return storage.setItem(TENANT_ID_KEY, value);
}

export {
  getAccessToken,
  getRefreshToken,
  getTenantId,
  setAccessToken,
  setRefreshToken,
  setTenantId,
};
