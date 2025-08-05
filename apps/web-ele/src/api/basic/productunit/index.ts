import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

// TODO @xingyu：貌似模块不对

export namespace ProductUnitApi {
  /** 产品单位信息 */
  export interface ProductUnit {
    id: number; // 编号
    groupId?: number; // 分组编号
    name?: string; // 单位名称
    basic?: number; // 基础单位
    number?: number; // 单位数量/相对于基础单位
    usageType: number; // 用途
  }
}

/** 查询产品单位分页 */
export function getProductUnitPage(params: PageParam) {
  return requestClient.get<PageResult<ProductUnitApi.ProductUnit>>(
    '/basic/product-unit/page',
    { params },
  );
}

/** 查询产品单位详情 */
export function getProductUnit(id: number) {
  return requestClient.get<ProductUnitApi.ProductUnit>(
    `/basic/product-unit/get?id=${id}`,
  );
}

/** 新增产品单位 */
export function createProductUnit(data: ProductUnitApi.ProductUnit) {
  return requestClient.post('/basic/product-unit/create', data);
}

/** 修改产品单位 */
export function updateProductUnit(data: ProductUnitApi.ProductUnit) {
  return requestClient.put('/basic/product-unit/update', data);
}

/** 删除产品单位 */
export function deleteProductUnit(id: number) {
  return requestClient.delete(`/basic/product-unit/delete?id=${id}`);
}

/** 批量删除产品单位 */
export function deleteProductUnitListByIds(ids: number[]) {
  return requestClient.delete(
    `/basic/product-unit/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出产品单位 */
export function exportProductUnit(params: any) {
  return requestClient.download('/basic/product-unit/export-excel', params);
}
