import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace XqWorkOrderApi {
  export interface WorkOrder {
    id?: number;
    no: string;
    sourceId?: number;
    externalSku?: string;
    title?: string;
    coverUrl?: string;
    categoryName?: string;
    gigaCategoryId?: number;
    status: number;
    contentTitle?: string;
    contentSellingPoints?: string;
    generatedImageUrl?: string;
    productId?: number;
    productSku?: string;
    assigneeUserId?: number;
    copyUserId?: number;
    imageUserId?: number;
    listingPlatformId?: string;
    listingShopId?: string;
    listingCategoryId?: string;
    listingPlatformName?: string;
    listingShopName?: string;
    listingCategoryName?: string;
    workflowPhase?: string;
    sourceDescription?: string;
    sourceImageUrls?: string;
    copyResultJson?: string;
    imagePromptJson?: string;
    rpaCopyWorkUuid?: string;
    rpaCopyStatus?: string;
    rpaCopyError?: string;
    createTime?: string;
  }

  export interface DispatchItem {
    productId?: string;
    sku: string;
    title?: string;
    coverUrl?: string;
    categoryName?: string;
    gigaCategoryId?: number;
  }

  export interface DispatchReq {
    listingPlatformId: string;
    listingShopId?: string;
    listingCategoryId: string;
    listingPlatformName?: string;
    listingShopName?: string;
    listingCategoryName?: string;
    items: DispatchItem[];
  }

  export interface CompleteReq {
    id: number;
    productSku: string;
    productName: string;
    categoryName?: string;
  }

  export interface PageQuery extends PageParam {
    no?: string;
    title?: string;
    externalSku?: string;
    keyword?: string;
    status?: number;
    gigaCategoryId?: number;
    copyUserId?: number;
    imageUserId?: number;
    copyReady?: boolean;
    workflowPhase?: string;
    listingPlatformId?: string;
    listingShopId?: string;
    listingCategoryId?: string;
  }

  export interface AssignImageReq {
    ids: number[];
    imageUserId: number;
    listingPlatformId?: string;
    listingShopId?: string;
  }
}

export function getXqWorkOrderPage(params: XqWorkOrderApi.PageQuery) {
  return requestClient.get<PageResult<XqWorkOrderApi.WorkOrder>>(
    '/xq/work-order/page',
    { params },
  );
}

export function getXqWorkOrder(id: number) {
  return requestClient.get<XqWorkOrderApi.WorkOrder>(
    `/xq/work-order/get?id=${id}`,
  );
}

export function dispatchXqWorkOrder(data: XqWorkOrderApi.DispatchReq) {
  return requestClient.post<XqWorkOrderApi.WorkOrder[]>(
    '/xq/work-order/dispatch',
    data,
  );
}

export function updateXqWorkOrder(
  data: Partial<XqWorkOrderApi.WorkOrder> & {
    contentDescription?: string;
    contentHighlight?: string;
    copyResultJson?: string;
    imagePromptJson?: string;
  },
) {
  return requestClient.put('/xq/work-order/update', data);
}

export function generateXqWorkOrderCopy(id: number) {
  return requestClient.post<XqWorkOrderApi.WorkOrder>(
    `/xq/work-order/generate-copy?id=${id}`,
  );
}

export function batchGenerateXqWorkOrderCopy(ids: number[]) {
  return requestClient.post<XqWorkOrderApi.WorkOrder[]>(
    '/xq/work-order/batch-generate-copy',
    { ids },
  );
}

export function batchAssignXqWorkOrderImage(
  data: XqWorkOrderApi.AssignImageReq,
) {
  return requestClient.post<number>('/xq/work-order/batch-assign-image', data);
}

export function generateXqWorkOrderImage(id: number) {
  return requestClient.post<XqWorkOrderApi.WorkOrder>(
    `/xq/work-order/generate-image?id=${id}`,
  );
}

export function completeXqWorkOrder(data: XqWorkOrderApi.CompleteReq) {
  return requestClient.post<number>('/xq/work-order/complete', data);
}

export function closeXqWorkOrder(id: number) {
  return requestClient.post<boolean>(`/xq/work-order/close?id=${id}`);
}

export function batchCloseXqWorkOrder(ids: number[]) {
  return requestClient.post<number>('/xq/work-order/batch-close', { ids });
}
