import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

// TODO @xingyu：貌似模块不对

export namespace ProductUnitGroupApi {
  /** 产品单位组信息 */
  export interface ProductUnitGroup {
    id: number; // 编号
    name?: string; // 产品单位组名称
    status?: number; // 开启状态
  }
}

/** 查询产品单位组分页 */
export function getProductUnitGroupPage(params: PageParam) {
  return requestClient.get<PageResult<ProductUnitGroupApi.ProductUnitGroup>>(
    '/basic/product-unit-group/page',
    { params },
  );
}

/** 查询产品单位组详情 */
export function getProductUnitGroup(id: number) {
  return requestClient.get<ProductUnitGroupApi.ProductUnitGroup>(
    `/basic/product-unit-group/get?id=${id}`,
  );
}

/** 新增产品单位组 */
export function createProductUnitGroup(
  data: ProductUnitGroupApi.ProductUnitGroup,
) {
  return requestClient.post('/basic/product-unit-group/create', data);
}

/** 修改产品单位组 */
export function updateProductUnitGroup(
  data: ProductUnitGroupApi.ProductUnitGroup,
) {
  return requestClient.put('/basic/product-unit-group/update', data);
}

/** 删除产品单位组 */
export function deleteProductUnitGroup(id: number) {
  return requestClient.delete(`/basic/product-unit-group/delete?id=${id}`);
}

/** 批量删除产品单位组 */
export function deleteProductUnitGroupListByIds(ids: number[]) {
  return requestClient.delete(
    `/basic/product-unit-group/delete-list?ids=${ids.join(',')}`,
  );
}

/** 导出产品单位组 */
export function exportProductUnitGroup(params: any) {
  return requestClient.download(
    '/basic/product-unit-group/export-excel',
    params,
  );
}
