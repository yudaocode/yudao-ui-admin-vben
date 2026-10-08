import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace AiModelApiKeyApi {
  /**
   * 一条密钥 = 一个接入源（官方 API 或某一个中转）。
   * 不同 gatewayType 字段含义/必填不同，勿套同一套中转专有配置。
   */
  export interface ApiKey {
    id?: number;
    name: string;
    apiKey: string;
    platform: string;
    url?: string;
    /** openai_official / aixoras / hao / toapis / cun / openai_compatible / custom */
    gatewayType?: string;
    /** 逗号串或前端用数组再拼接 */
    capabilities?: string | string[];
    chatModel?: string;
    visionModel?: string;
    imageModel?: string;
    imageEditModel?: string;
    imageBodyStyle?: string;
    supportsAsync?: null | number;
    preferResponsesApi?: null | number;
    visionImageDetail?: string;
    /** 扩展 JSON 字符串 */
    extraConfig?: string;
    remark?: string;
    status: number;
  }
}

export function getApiKeyPage(params: PageParam) {
  return requestClient.get<PageResult<AiModelApiKeyApi.ApiKey>>(
    '/ai/api-key/page',
    { params },
  );
}

export function getApiKeySimpleList() {
  return requestClient.get<AiModelApiKeyApi.ApiKey[]>(
    '/ai/api-key/simple-list',
  );
}

export function getApiKey(id: number) {
  return requestClient.get<AiModelApiKeyApi.ApiKey>(`/ai/api-key/get?id=${id}`);
}

export function createApiKey(data: AiModelApiKeyApi.ApiKey) {
  return requestClient.post('/ai/api-key/create', data);
}

export function updateApiKey(data: AiModelApiKeyApi.ApiKey) {
  return requestClient.put('/ai/api-key/update', data);
}

export function deleteApiKey(id: number) {
  return requestClient.delete(`/ai/api-key/delete?id=${id}`);
}
