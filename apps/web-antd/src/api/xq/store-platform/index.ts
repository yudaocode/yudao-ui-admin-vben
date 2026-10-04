import { requestClient } from '#/api/request';

export namespace XqStorePlatformApi {
  export interface Platform {
    id: number;
    code: string;
    name: string;
    sourcePlatformId?: string;
    sort?: number;
    enabled?: boolean;
    remark?: string;
    storeCount?: number;
  }

  export interface PlatformSaveReq {
    id?: number;
    code: string;
    name: string;
    sourcePlatformId?: string;
    sort?: number;
    enabled?: boolean;
    remark?: string;
  }

  export interface Store {
    id: number;
    name: string;
    platformId: number;
    platformCode?: string;
    platformName?: string;
    sourcePlatformId?: string;
    sourceStoreId?: number;
    account?: string;
    passwordMask?: string;
    hasPassword?: boolean;
    imageUrl?: string;
    status?: number;
    deptId?: string;
    remark?: string;
  }

  export interface StoreSaveReq {
    id?: number;
    name: string;
    platformId: number;
    sourceStoreId?: number;
    account?: string;
    password?: string;
    imageUrl?: string;
    status?: number;
    deptId?: string;
    remark?: string;
  }

  export interface Alias {
    id: number;
    platformId: number;
    platformCode?: string;
    platformName?: string;
    alias: string;
  }

  export interface AliasSaveReq {
    id?: number;
    platformId: number;
    alias: string;
  }

  export interface UserStore {
    userId: number;
    restricted: boolean;
    storeIds: number[];
  }

  export interface SyncResult {
    platformUpserted: number;
    storeUpserted: number;
    aliasBound: number;
    userCreated?: number;
    userMatched?: number;
    roleAssigned?: number;
    userStoreBound?: number;
    unmatchedAccounts?: string[];
  }
}

export function getXqPlatforms() {
  return requestClient.get<XqStorePlatformApi.Platform[]>(
    '/xq/store-platform/platform/list',
  );
}

export function saveXqPlatform(data: XqStorePlatformApi.PlatformSaveReq) {
  return requestClient.post<number>('/xq/store-platform/platform/save', data);
}

export function deleteXqPlatform(id: number) {
  return requestClient.delete<boolean>('/xq/store-platform/platform/delete', {
    params: { id },
  });
}

export function getXqStores(platformId?: number) {
  return requestClient.get<XqStorePlatformApi.Store[]>(
    '/xq/store-platform/store/list',
    { params: platformId ? { platformId } : {} },
  );
}

export function saveXqStore(data: XqStorePlatformApi.StoreSaveReq) {
  return requestClient.post<number>('/xq/store-platform/store/save', data);
}

export function deleteXqStore(id: number) {
  return requestClient.delete<boolean>('/xq/store-platform/store/delete', {
    params: { id },
  });
}

export function getXqPlatformAliases() {
  return requestClient.get<XqStorePlatformApi.Alias[]>(
    '/xq/store-platform/alias/list',
  );
}

export function saveXqPlatformAlias(data: XqStorePlatformApi.AliasSaveReq) {
  return requestClient.post<number>('/xq/store-platform/alias/save', data);
}

export function deleteXqPlatformAlias(id: number) {
  return requestClient.delete<boolean>('/xq/store-platform/alias/delete', {
    params: { id },
  });
}

export function getXqUserStores(userId: number) {
  return requestClient.get<XqStorePlatformApi.UserStore>(
    '/xq/store-platform/user-store',
    { params: { userId } },
  );
}

export function bindXqUserStores(userId: number, storeIds: number[]) {
  return requestClient.post<boolean>('/xq/store-platform/user-store/bind', {
    userId,
    storeIds,
  });
}

export function syncXqStorePlatformLegacy() {
  return requestClient.post<XqStorePlatformApi.SyncResult>(
    '/xq/store-platform/sync-legacy',
  );
}
