import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace XqAgentAiTestApi {
  export interface ImageItem {
    name?: string;
    url?: string;
    displayUrl?: string;
    ossUrl?: string;
  }

  export interface CopyItem {
    title?: string;
    description?: string;
    bullets?: string[];
    productStyle?: string;
  }

  export interface Item {
    id: string;
    sku: string;
    productName?: string;
    imageCount?: number;
    coverUrl?: string;
    batchNo?: string;
    generatedAt?: string;
    updateDate?: string;
    listingPlatformId?: string;
    platformName?: string;
    shopId?: string;
    listingCategoryId?: string;
    categoryName?: string;
    assignOwnerUserId?: string;
    assignOwnerName?: string;
    assignCopyUserId?: string;
    assignCopyName?: string;
    assignImageUserId?: string;
    assignImageName?: string;
    assignPhase?: string;
    copyTitle?: string;
    hasCopy?: boolean;
    bulletCount?: number;
    images?: ImageItem[];
    copy?: CopyItem;
  }

  export interface PageReq extends PageParam {
    sku?: string;
    keyword?: string;
    assignedOnly?: boolean;
  }
}

export function getXqAgentAiTestPage(params: XqAgentAiTestApi.PageReq) {
  return requestClient.get<PageResult<XqAgentAiTestApi.Item>>(
    '/xq/agent-ai-test/page',
    { params },
  );
}

export function getXqAgentAiTest(id: string) {
  return requestClient.get<XqAgentAiTestApi.Item>('/xq/agent-ai-test/get', {
    params: { id },
  });
}
