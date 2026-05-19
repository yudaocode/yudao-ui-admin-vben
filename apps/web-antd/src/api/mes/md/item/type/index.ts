import { requestClient } from '#/api/request';

export namespace MesMdItemTypeApi {
  /** MES 物料产品分类 */
  export interface ItemType {
    id?: number;
    parentId?: number;
    code?: string;
    name?: string;
    itemOrProduct?: string;
    sort?: number;
    status?: number;
    remark?: string;
    createTime?: Date;
    children?: ItemType[];
  }
}

/** 查询物料产品分类列表 */
export function getItemTypeList(params?: any) {
  return requestClient.get<MesMdItemTypeApi.ItemType[]>(
    '/mes/md/item-type/list',
    { params },
  );
}

/** 查询物料产品分类精简列表 */
export function getItemTypeSimpleList() {
  return requestClient.get<MesMdItemTypeApi.ItemType[]>(
    '/mes/md/item-type/simple-list',
  );
}

/** 查询物料产品分类详情 */
export function getItemType(id: number) {
  return requestClient.get<MesMdItemTypeApi.ItemType>(
    `/mes/md/item-type/get?id=${id}`,
  );
}

/** 新增物料产品分类 */
export function createItemType(data: MesMdItemTypeApi.ItemType) {
  return requestClient.post('/mes/md/item-type/create', data);
}

/** 修改物料产品分类 */
export function updateItemType(data: MesMdItemTypeApi.ItemType) {
  return requestClient.put('/mes/md/item-type/update', data);
}

/** 删除物料产品分类 */
export function deleteItemType(id: number) {
  return requestClient.delete(`/mes/md/item-type/delete?id=${id}`);
}
