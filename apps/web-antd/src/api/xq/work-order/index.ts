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
    imageStatus?: string;
    listingValuesJson?: string;
    listingResultJson?: string;
    listingPlatformId?: string;
    listingShopId?: string;
    listingCategoryId?: string;
    listingPlatformName?: string;
    listingShopName?: string;
    listingCategoryName?: string;
    listingCountryCode?: string;
    listingCountryName?: string;
    workflowPhase?: string;
    sourceDescription?: string;
    sourceImageUrls?: string;
    copyResultJson?: string;
    imagePromptJson?: string;
    rpaCopyWorkUuid?: string;
    rpaCopyStatus?: string;
    rpaCopyError?: string;
    parentWorkOrderId?: number;
    parentSku?: string;
    variantLabel?: string;
    itemCode?: string;
    mainColor?: string;
    upc?: string;
    price?: number;
    currency?: string;
    qtyAvailable?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    variants?: WorkOrder[];
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
    listingPlatformName?: string;
    listingShopName?: string;
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
    mineUserId?: number;
    imageStatus?: string;
    listingReady?: boolean;
    mineImageUserId?: number;
    flowStatus?: string;
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
    generatedImageUrl?: string;
    imagePromptJson?: string;
    listingCategoryId?: string;
    listingCategoryName?: string;
    listingCountryCode?: string;
    listingCountryName?: string;
    listingShopId?: string;
    listingShopName?: string;
    listingValuesJson?: string;
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

export function getXqAssignableImageUsers() {
  return requestClient.get<
    Array<{ id: number; nickname?: string; username?: string }>
  >('/xq/work-order/assignable-image-users');
}

export function batchAssignXqWorkOrderImage(
  data: XqWorkOrderApi.AssignImageReq,
) {
  return requestClient.post<number>('/xq/work-order/batch-assign-image', data);
}

export function updateXqWorkOrderImageStatus(data: {
  id: number;
  imageStatus:
    | 'done'
    | 'generated'
    | 'pending'
    | 'rejected'
    | 'revised'
    | 'todo';
}) {
  return requestClient.post<boolean>('/xq/work-order/image-status', data);
}

export function listXqWorkOrder(data: {
  id: number;
  productName?: string;
  productSku?: string;
  values: Record<string, string>;
}) {
  return requestClient.post<number>('/xq/work-order/list', data);
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
