import { requestClient } from '#/api/request';

export namespace MesMdItemTypeApi {
  /** MES 物料产品分类 */
  export interface ItemType {
    id?: number; // 分类编号
    parentId?: number; // 父分类编号
    code?: string; // 分类编码
    name?: string; // 分类名称
    itemOrProduct?: string; // 物料/产品标识
    sort?: number; // 显示排序
    status?: number; // 状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
    children?: ItemType[]; // 子分类
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
