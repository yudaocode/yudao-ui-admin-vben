import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace WmsMerchantApi {
  /** WMS 往来企业 */
  export interface Merchant {
    id?: number;
    code?: string;
    name?: string;
    type?: number;
    level?: string;
    bankName?: string;
    bankAccount?: string;
    address?: string;
    mobile?: string;
    telephone?: string;
    contact?: string;
    email?: string;
    remark?: string;
    createTime?: Date;
  }

  /** WMS 往来企业精简列表请求 */
  export interface MerchantSimpleListReq {
    types?: number[];
  }
}

/** 查询往来企业分页 */
export function getMerchantPage(params: PageParam) {
  return requestClient.get<PageResult<WmsMerchantApi.Merchant>>(
    '/wms/merchant/page',
    { params },
  );
}

/** 查询往来企业精简列表 */
export function getMerchantSimpleList(
  params?: WmsMerchantApi.MerchantSimpleListReq,
) {
  return requestClient.get<WmsMerchantApi.Merchant[]>(
    '/wms/merchant/simple-list',
    { params },
  );
}

/** 查询往来企业详情 */
export function getMerchant(id: number) {
  return requestClient.get<WmsMerchantApi.Merchant>(
    `/wms/merchant/get?id=${id}`,
  );
}

/** 新增往来企业 */
export function createMerchant(data: WmsMerchantApi.Merchant) {
  return requestClient.post('/wms/merchant/create', data);
}

/** 修改往来企业 */
export function updateMerchant(data: WmsMerchantApi.Merchant) {
  return requestClient.put('/wms/merchant/update', data);
}

/** 删除往来企业 */
export function deleteMerchant(id: number) {
  return requestClient.delete(`/wms/merchant/delete?id=${id}`);
}

/** 导出往来企业 */
export function exportMerchant(params: any) {
  return requestClient.download('/wms/merchant/export-excel', { params });
}
