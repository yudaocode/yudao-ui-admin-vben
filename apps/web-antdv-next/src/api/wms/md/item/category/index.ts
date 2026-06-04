import { requestClient } from '#/api/request';

export namespace WmsItemCategoryApi {
  /** WMS 商品分类 */
  export interface ItemCategory {
    id?: number;
    parentId?: number;
    code?: string;
    name?: string;
    sort?: number;
    status?: number;
    createTime?: Date;
    children?: ItemCategory[];
  }
}

/** 查询商品分类列表 */
export function getItemCategoryList(params?: any) {
  return requestClient.get<WmsItemCategoryApi.ItemCategory[]>(
    '/wms/item-category/list',
    { params },
  );
}

/** 查询商品分类精简列表 */
export function getItemCategorySimpleList() {
  return requestClient.get<WmsItemCategoryApi.ItemCategory[]>(
    '/wms/item-category/simple-list',
  );
}

/** 查询商品分类详情 */
export function getItemCategory(id: number) {
  return requestClient.get<WmsItemCategoryApi.ItemCategory>(
    `/wms/item-category/get?id=${id}`,
  );
}

/** 新增商品分类 */
export function createItemCategory(data: WmsItemCategoryApi.ItemCategory) {
  return requestClient.post('/wms/item-category/create', data);
}

/** 修改商品分类 */
export function updateItemCategory(data: WmsItemCategoryApi.ItemCategory) {
  return requestClient.put('/wms/item-category/update', data);
}

/** 删除商品分类 */
export function deleteItemCategory(id: number) {
  return requestClient.delete(`/wms/item-category/delete?id=${id}`);
}
