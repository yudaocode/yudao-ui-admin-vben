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
    /** 图片驳回原因 */
    imageRejectReason?: string;
    /** export_pending_confirm=导表成功待确认 / listed */
    listingStatus?: string;
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
    /** 是否勾选独立跑文案 RPA */
    copyRpaSelected?: boolean;
    rpaImageWorkUuid?: string;
    rpaImageStatus?: string;
    rpaImageError?: string;
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
    listingCategoryId?: string;
    listingPlatformName?: string;
    listingShopName?: string;
    listingCategoryName?: string;
    /** SKU → 复用文案来源任务 ID */
    reuseCopyFromIds?: Record<string, number>;
    /** SKU → 复用图片来源任务 ID */
    reuseImageFromIds?: Record<string, number>;
    items: DispatchItem[];
  }

  export interface ReuseCandidate {
    workOrderId: number;
    no?: string;
    listingPlatformId?: string;
    listingPlatformName?: string;
    listingShopName?: string;
    status?: number;
    workflowPhase?: string;
    imageStatus?: string;
    hasCopy?: boolean;
    hasImage?: boolean;
    contentTitle?: string;
    contentSellingPoints?: string;
    description?: string;
    coverUrl?: string;
    imageUrls?: string[];
  }

  export interface ReuseSkuGroup {
    sku: string;
    candidates: ReuseCandidate[];
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
    /** 大健云仓类目（含子树） */
    gigaCategoryId?: number;
    copyUserId?: number;
    imageUserId?: number;
    copyReady?: boolean;
    workflowPhase?: string;
    listingPlatformId?: string;
    listingShopId?: string;
    listingCategoryId?: string;
    /** true=已选类目 / false=未选类目 */
    listingCategorySelected?: boolean;
    mineUserId?: number;
    imageStatus?: string;
    listingReady?: boolean;
    mineImageUserId?: number;
    flowStatus?: string;
    /** 已选产品池：有图文但未选平台/分类 */
    selectedPool?: boolean;
  }

  export interface BindListingReq {
    expandFamily?: boolean;
    ids: number[];
    listingCategoryId: string;
    listingCategoryName?: string;
    listingPlatformId: string;
    listingPlatformName?: string;
    listingShopId?: string;
    listingShopName?: string;
  }

  export interface AssignImageReq {
    ids: number[];
    imageUserId: number;
    listingPlatformId?: string;
    listingShopId?: string;
    /** 默认 true：整家族；编辑页勾选分配传 false */
    expandFamily?: boolean;
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

/** 下发前反查其它平台可复用文案/图片 */
export function lookupXqWorkOrderReuseCandidates(data: {
  excludePlatformIds?: string[];
  skus: string[];
}) {
  return requestClient.post<XqWorkOrderApi.ReuseSkuGroup[]>(
    '/xq/work-order/reuse-candidates',
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

/** 已选产品池：补绑平台 + 分类 */
export function bindXqWorkOrderListing(data: XqWorkOrderApi.BindListingReq) {
  return requestClient.post<number>('/xq/work-order/bind-listing', data);
}

export function generateXqWorkOrderCopy(id: number) {
  return requestClient.post<XqWorkOrderApi.WorkOrder>(
    `/xq/work-order/generate-copy?id=${id}`,
  );
}

export function regenerateXqWorkOrderCopy(data: {
  contentDescription?: string;
  contentSellingPoints?: string;
  contentTitle?: string;
  featureIndex?: number;
  id: number;
  revisionPrompt?: string;
  /** all | title | description | feature */
  target?: string;
}) {
  return requestClient.post<XqWorkOrderApi.WorkOrder>(
    '/xq/work-order/regenerate-copy',
    data,
  );
}

/** 勾选变体入队文案 RPA；未勾选变体沿用主体文案 */
export function enqueueXqWorkOrderCopyRpa(data: {
  rootId: number;
  selectedIds: number[];
}) {
  return requestClient.post<number>('/xq/work-order/enqueue-copy-rpa', data);
}

export interface XqRpaCopyPullResp {
  count?: number;
  jobs?: Array<Record<string, unknown>>;
  loginUserId?: number;
  tenantId?: number;
  queuedForUser?: number;
  queuedOnDesk?: number;
  queuedAll?: number;
}

/** RPA 领取待跑文案；dryRun=true 只探测不改 queued */
export function pullXqWorkOrderCopyRpa(data?: {
  dryRun?: boolean;
  limit?: number;
}) {
  return requestClient.post<XqRpaCopyPullResp>(
    '/xq/work-order/rpa-copy-pull',
    data || {},
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
    | 'running'
    | 'todo';
  /** 槽位：rejected 写入驳回；revised 清除该槽驳回；不传则作用于全部已出图槽位 */
  rejectIndex?: number;
  /** 驳回时必填 */
  rejectReason?: string;
}) {
  return requestClient.post<boolean>('/xq/work-order/image-status', data);
}

export function listXqWorkOrder(data: {
  id: number;
  /** api=程序判定成功；export=导表待用户确认 */
  listingMode?: 'api' | 'export';
  productName?: string;
  productSku?: string;
  values: Record<string, string>;
}) {
  return requestClient.post<number>('/xq/work-order/list', data);
}

/** 导表上架：下载 Excel，并置为导表待确认 */
export async function exportXqWorkOrderListing(data: {
  id: number;
  productName?: string;
  productSku?: string;
  values: Record<string, string>;
}) {
  const blob = await requestClient.post<Blob>(
    '/xq/work-order/listing-export',
    { ...data, listingMode: 'export' },
    {
      responseType: 'blob',
      timeout: 10 * 60 * 1000,
    },
  );
  return blob;
}

export function confirmXqWorkOrderListing(id: number) {
  return requestClient.post<number>(`/xq/work-order/confirm-listing?id=${id}`);
}

/** 单条入队生图 RPA（美工本机机器人拉取执行） */
export function generateXqWorkOrderImage(id: number) {
  return requestClient.post<XqWorkOrderApi.WorkOrder>(
    `/xq/work-order/generate-image?id=${id}`,
  );
}

/** 批量入队生图 RPA */
export function enqueueXqWorkOrderImageRpa(ids: number[]) {
  return requestClient.post<number>('/xq/work-order/enqueue-image-rpa', {
    ids,
  });
}

export namespace XqWorkOrderReviseImageApi {
  export interface RevisePreviewReq {
    id: number;
    promptIndex: number;
    revisePrompt: string;
    referenceUrls?: string[];
    includeCurrentAi?: boolean;
    lockProduct?: boolean;
  }

  export interface RevisePreviewResp {
    previewUrl?: string;
    currentAiUrl?: string;
    usedReferenceUrls?: string[];
    promptUsed?: string;
    model?: string;
    costMs?: number;
  }

  export interface ReviseTask {
    taskId?: string;
    status?: 'fail' | 'pending' | 'running' | 'success' | string;
    message?: string;
    workOrderId?: number;
    promptIndex?: number;
    result?: RevisePreviewResp;
  }
}

/** 提交单图改图到后台（立即返回 taskId） */
export function submitXqWorkOrderReviseImage(
  data: XqWorkOrderReviseImageApi.RevisePreviewReq,
) {
  return requestClient.post<XqWorkOrderReviseImageApi.ReviseTask>(
    '/xq/work-order/revise-image-preview/submit',
    data,
  );
}

export function getXqWorkOrderReviseImageTask(taskId: string) {
  return requestClient.get<XqWorkOrderReviseImageApi.ReviseTask>(
    '/xq/work-order/revise-image-preview/task',
    { params: { taskId } },
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
