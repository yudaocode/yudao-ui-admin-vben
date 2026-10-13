import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace XqProductApi {
  export interface Product {
    id?: string;
    sku: string;
    itemCode?: string;
    name: string;
    categoryName?: string;
    gigaCategoryId?: number;
    imageUrl?: string;
    imageUrls?: string[];
    imageCount?: number;
    description?: string;
    qtyAvailable?: number;
    supplierCode?: string;
    supplierName?: string;
    listedTag?: string;
    pickedPlatforms?: PickedPlatform[];
    price?: number;
    exclusivePrice?: number;
    discountedPrice?: number;
    /** 自提运费 */
    pickupShippingFee?: number;
    /** 代发运费 */
    dropshipShippingFee?: number;
    currency?: string;
    status: number;
    remark?: string;
    createTime?: string;
    mainColor?: string;
    familySku?: string;
    upc?: string;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
    lengthUnit?: string;
    weight?: number;
    weightKg?: number;
    weightUnit?: string;
    assembledLength?: number;
    assembledWidth?: number;
    assembledHeight?: number;
    assembledWeight?: number;
    assembledLengthUnit?: string;
    assembledWeightUnit?: string;
    mainMaterial?: string;
    placeOfOrigin?: string;
    brandName?: string;
    characteristics?: string;
    attributesJson?: string;
    variants?: Variant[];
  }

  export interface PickedPlatform {
    id: string;
    name?: string;
  }

  export interface Variant {
    id?: string;
    sku: string;
    itemCode?: string;
    name?: string;
    imageUrl?: string;
    mainColor?: string;
    qtyAvailable?: number;
    price?: number;
    discountedPrice?: number;
    pickupShippingFee?: number;
    dropshipShippingFee?: number;
  }

  export interface CategoryNode {
    id: number;
    gigaId: number;
    parentId?: number;
    name: string;
    level: number;
    sortOrder?: number;
    imagePath?: string;
    pathIds?: string;
    pathNames?: string;
    href?: string;
    children?: CategoryNode[];
  }
}

export function getXqProductPage(
  params: PageParam & {
    excludePickedPlatformId?: string;
    gigaCategoryId?: number;
    name?: string;
  },
) {
  return requestClient.get<PageResult<XqProductApi.Product>>(
    '/xq/product/page',
    {
      params,
    },
  );
}

export function getXqProduct(id: string) {
  return requestClient.get<XqProductApi.Product>(`/xq/product/get?id=${id}`);
}

/** 详情缺失时：用全部大健云仓凭证拉详情并补自提/代发价 */
export function ensureXqProductDetail(id: string) {
  return requestClient.post<XqProductApi.Product>(
    `/xq/product/ensure-detail?id=${encodeURIComponent(id)}`,
    {},
  );
}

export function createXqProduct(data: XqProductApi.Product) {
  return requestClient.post('/xq/product/create', data);
}

export function updateXqProduct(data: XqProductApi.Product) {
  return requestClient.put('/xq/product/update', data);
}

export function deleteXqProduct(id: number | string) {
  return requestClient.delete(`/xq/product/delete?id=${id}`);
}

export function getXqCategoryTree() {
  return requestClient.get<XqProductApi.CategoryNode[]>('/xq/category/tree');
}

export function getXqCategoryLevel1() {
  return requestClient.get<XqProductApi.CategoryNode[]>('/xq/category/level1');
}
