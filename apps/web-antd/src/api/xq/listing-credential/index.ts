import { requestClient } from '#/api/request';

export namespace XqListingCredentialApi {
  export type Provider = 'mirakl' | 'wayfair';

  export interface Credential {
    id: number;
    platformId?: number;
    sourcePlatformId?: string;
    platformCode: string;
    platformName?: string;
    provider: Provider;
    baseUrl?: string;
    shopId?: string;
    apiKeyMask?: string;
    clientId?: string;
    clientSecretMask?: string;
    supplierId?: string;
    env?: string;
    extraJson?: string;
    enabled?: boolean;
    syncedFromXqAt?: string;
    remark?: string;
    updateTime?: string;
  }

  export interface SaveReq {
    id?: number;
    platformId?: number;
    sourcePlatformId?: string;
    platformCode: string;
    platformName?: string;
    provider: Provider;
    baseUrl?: string;
    shopId?: string;
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    supplierId?: string;
    env?: string;
    extraJson?: string;
    enabled?: boolean;
    remark?: string;
  }

  export interface SyncResult {
    mirakl?: number;
    wayfair?: number;
    skipped?: number;
    totalLegacy?: number;
  }
}

export function getXqListingCredentials() {
  return requestClient.get<XqListingCredentialApi.Credential[]>(
    '/xq/listing-credential/list',
  );
}

export function saveXqListingCredential(data: XqListingCredentialApi.SaveReq) {
  return requestClient.post<number>('/xq/listing-credential/save', data);
}

export function deleteXqListingCredential(id: number) {
  return requestClient.delete<boolean>('/xq/listing-credential/delete', {
    params: { id },
  });
}

export function syncXqListingCredentialsFromXq() {
  return requestClient.post<XqListingCredentialApi.SyncResult>(
    '/xq/listing-credential/sync-from-xq',
  );
}
