import { requestClient } from '#/api/request';

export namespace XqListingApi {
  export interface Platform {
    id: string;
    code: string;
    name: string;
    sortOrder?: number;
    enabled?: boolean;
    /** excel_template / mirakl_api / wayfair_api */
    catalogSource?: string;
    /** export | api */
    listingMode?: 'api' | 'export';
    sourcePlatformId?: string;
  }

  export interface Shop {
    id: string;
    platformId: string;
    code: string;
    name: string;
    enabled?: boolean;
    storePlatform?: string;
  }

  export interface CategoryNode {
    id: string;
    name: string;
    parentId?: string;
    platformId?: string;
    sortOrder?: number;
    children?: CategoryNode[];
  }

  export interface CopyRule {
    id?: string;
    platformId?: string;
    platformCode?: string;
    platformName?: string;
    code?: string;
    name: string;
    configJson: string;
    enabled?: boolean;
    remark?: string;
  }

  export interface ImageRule {
    id?: string;
    platformId?: string;
    platformCode?: string;
    platformName?: string;
    categoryId?: string;
    categoryName?: string;
    name: string;
    promptText: string;
    negativePrompt?: string;
    configJson?: string;
    enabled?: boolean;
    remark?: string;
  }

  export interface FieldEnumOption {
    label: string;
    value: string;
  }

  export interface CategoryField {
    code: string;
    label: string;
    type?: string;
    requirementLevel?: string;
    required?: boolean;
    fixed?: boolean;
    remark?: string;
    source?: string;
    groupLabel?: string;
    bandLabel?: string;
    valuesList?: string;
    options?: FieldEnumOption[];
    defaultValue?: string;
    valueSource?: string;
    zone?: string;
    sourceCount?: number;
  }

  export interface FieldPartition {
    id: string;
    name: string;
    keywords?: string;
    system?: boolean;
    color?: string;
  }

  export interface FieldPool {
    platformId?: string;
    total?: number;
    requiredCount?: number;
    categoryCount?: number;
    fields?: CategoryField[];
    partitions?: FieldPartition[];
    sourceHint?: string;
  }

  export interface CategoryFieldTemplate {
    id?: string;
    categoryId?: string;
    platformId?: string;
    hierarchyCode?: string;
    name?: string;
    total?: number;
    requiredCount?: number;
    recommendedCount?: number;
    optionalCount?: number;
    fields?: CategoryField[];
  }

  export interface CategoryFieldConfigItem {
    code: string;
    defaultValue?: string;
    valueSource?: string;
    zone?: string;
    required?: boolean;
    fixed?: boolean;
    remark?: string;
    groupLabel?: string;
  }

  export interface CategoryFieldConfig {
    id?: string;
    platformId?: string;
    categoryId?: string;
    fields?: CategoryFieldConfigItem[];
  }
}

export function getXqListingPlatforms() {
  return requestClient.get<XqListingApi.Platform[]>('/xq/listing/platforms');
}

export function getXqListingShops(platformId?: string) {
  return requestClient.get<XqListingApi.Shop[]>('/xq/listing/shops', {
    params: { platformId },
  });
}

export function getXqListingCategories(platformId: string) {
  return requestClient.get<XqListingApi.CategoryNode[]>(
    '/xq/listing/categories',
    {
      params: { platformId },
    },
  );
}

export function getXqCategoryFieldTemplate(categoryId: string) {
  return requestClient.get<XqListingApi.CategoryFieldTemplate>(
    '/xq/listing/category-template',
    { params: { categoryId } },
  );
}

export function getXqCopyRules() {
  return requestClient.get<XqListingApi.CopyRule[]>('/xq/listing/copy-rules');
}

export function getXqCopyRule(platformId?: string) {
  return requestClient.get<XqListingApi.CopyRule>('/xq/listing/copy-rule', {
    params: { platformId: platformId || '' },
  });
}

export function saveXqCopyRule(data: {
  configJson: string;
  enabled?: boolean;
  name: string;
  platformId?: string;
  remark?: string;
}) {
  return requestClient.post('/xq/listing/copy-rule', data);
}

export function getXqImageRules(platformId?: string) {
  return requestClient.get<XqListingApi.ImageRule[]>(
    '/xq/listing/image-rules',
    {
      params: { platformId: platformId || '' },
    },
  );
}

export function getXqImageRule(platformId?: string, categoryId?: string) {
  return requestClient.get<XqListingApi.ImageRule>('/xq/listing/image-rule', {
    params: {
      platformId: platformId || '',
      categoryId: categoryId || '',
    },
  });
}

export function saveXqImageRule(data: {
  categoryId?: string;
  categoryName?: string;
  configJson?: string;
  enabled?: boolean;
  name: string;
  negativePrompt?: string;
  platformId?: string;
  promptText: string;
  remark?: string;
}) {
  return requestClient.post('/xq/listing/image-rule', data);
}

export function getXqCategoryFieldConfigs(platformId: string) {
  return requestClient.get<XqListingApi.CategoryFieldConfig[]>(
    '/xq/listing/category-field-configs',
    { params: { platformId } },
  );
}

export function saveXqCategoryFieldConfig(data: {
  categoryId: string;
  fields: XqListingApi.CategoryFieldConfigItem[];
  platformId: string;
}) {
  return requestClient.post('/xq/listing/category-field-config', data);
}

export function getXqFieldPool(params: {
  country?: string;
  platformId: string;
  shopId?: string;
}) {
  return requestClient.get<XqListingApi.FieldPool>('/xq/listing/field-pool', {
    params,
  });
}

export function saveXqShopFieldConfig(data: {
  country: string;
  fields: XqListingApi.CategoryFieldConfigItem[];
  partitions: XqListingApi.FieldPartition[];
  platformId: string;
  shopId: string;
}) {
  return requestClient.post('/xq/listing/shop-field-config', data);
}

export interface XqWorkbenchPlatform {
  id: string;
  code: string;
  name: string;
  sortOrder?: number;
  shops?: XqListingApi.Shop[];
}

export function getXqWorkbenchScope() {
  return requestClient.get<{ platforms: XqWorkbenchPlatform[] }>(
    '/xq/listing/workbench-scope',
  );
}

export namespace XqSpecialConfigApi {
  export interface SkuSegment {
    type: string;
    value?: string;
    format?: string;
    width?: number;
    start?: number;
  }

  export interface SkuRule {
    id?: string;
    platformId?: string;
    platformName?: string;
    shopId?: string;
    shopName?: string;
    ownerUserId?: string;
    ownerUserName?: string;
    name?: string;
    segments?: SkuSegment[];
    enabled?: boolean;
    skipSku?: boolean;
    /** 同店铺默认规则 */
    isDefault?: boolean;
  }

  export interface MarkupRule {
    id?: string;
    platformId?: string;
    platformName?: string;
    shopId?: string;
    shopName?: string;
    ownerUserId?: string;
    ownerUserName?: string;
    name?: string;
    mode?: string;
    value?: number;
    freightRate?: number;
    applyTo?: string;
    enabled?: boolean;
    /** 同店铺默认规则 */
    isDefault?: boolean;
    summary?: string;
    samplePrice?: number;
  }

  export interface UpcRule {
    id?: string;
    platformId?: string;
    platformName?: string;
    shopId?: string;
    name?: string;
    mode?: string;
    flagDigit?: string;
    manufacturerCode?: string;
    productWidth?: number;
    productStart?: number;
    enabled?: boolean;
    poolFreeAvailable?: number;
    poolPaidAvailable?: number;
    poolUsed?: number;
  }

  export interface UpcPoolItem {
    id: string;
    upc: string;
    poolType: string;
    status: string;
    claimedByName?: string;
    claimedAt?: string;
    createDate?: string;
  }

  export interface UpcPoolStats {
    freeAvailable?: number;
    paidAvailable?: number;
    used?: number;
    voidCount?: number;
  }

  export interface UpcImportResult {
    imported: number;
    skipped: number;
    invalid?: string[];
    poolType?: string;
  }
}

export function getXqSkuRules(platformId: string, shopId?: string) {
  return requestClient.get<XqSpecialConfigApi.SkuRule[]>(
    '/xq/listing/sku-rules',
    { params: { platformId, shopId: shopId || undefined } },
  );
}

export function saveXqSkuRule(data: XqSpecialConfigApi.SkuRule) {
  return requestClient.post<XqSpecialConfigApi.SkuRule>(
    '/xq/listing/sku-rule',
    data,
  );
}

export function deleteXqSkuRule(id: string) {
  return requestClient.delete('/xq/listing/sku-rule', { params: { id } });
}

export function getXqPriceMarkupRules(platformId: string, shopId?: string) {
  return requestClient.get<XqSpecialConfigApi.MarkupRule[]>(
    '/xq/listing/price-markup-rules',
    { params: { platformId, shopId: shopId || undefined } },
  );
}

export function saveXqPriceMarkupRule(data: XqSpecialConfigApi.MarkupRule) {
  return requestClient.post<XqSpecialConfigApi.MarkupRule>(
    '/xq/listing/price-markup-rule',
    data,
  );
}

export function deleteXqPriceMarkupRule(id: string) {
  return requestClient.delete('/xq/listing/price-markup-rule', {
    params: { id },
  });
}

export function getXqUpcRules(platformId: string) {
  return requestClient.get<XqSpecialConfigApi.UpcRule[]>(
    '/xq/listing/upc-rules',
    { params: { platformId } },
  );
}

export function saveXqUpcRule(data: XqSpecialConfigApi.UpcRule) {
  return requestClient.post<XqSpecialConfigApi.UpcRule>(
    '/xq/listing/upc-rule',
    data,
  );
}

export function deleteXqUpcRule(id: string) {
  return requestClient.delete('/xq/listing/upc-rule', { params: { id } });
}

export function getXqUpcPoolStats() {
  return requestClient.get<XqSpecialConfigApi.UpcPoolStats>(
    '/xq/listing/upc-pool/stats',
  );
}

export function getXqUpcPoolPage(params: {
  pageNo?: number;
  pageSize?: number;
  poolType?: string;
  status?: string;
}) {
  return requestClient.get<{
    list: XqSpecialConfigApi.UpcPoolItem[];
    total: number;
  }>('/xq/listing/upc-pool', { params });
}

export function importXqUpcPool(data: { poolType: string; text: string }) {
  return requestClient.post<XqSpecialConfigApi.UpcImportResult>(
    '/xq/listing/upc-pool/import',
    data,
  );
}

export function voidXqUpcPoolItem(id: string) {
  return requestClient.post('/xq/listing/upc-pool/void', null, {
    params: { id },
  });
}

export function releaseXqUpcPoolItem(id: string) {
  return requestClient.post('/xq/listing/upc-pool/release', null, {
    params: { id },
  });
}
