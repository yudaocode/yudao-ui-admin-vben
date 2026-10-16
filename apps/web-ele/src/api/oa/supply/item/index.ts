import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace OaSupplyItemApi {
  /** OA 办公用品 */
  export interface SupplyItem {
    id?: number; // 编号
    deptId?: number; // 所属部门
    name?: string; // 物品名称
    no?: string; // 物品编码
    category?: number; // 类别
    manageType?: number; // 管理类型
    model?: string; // 规格型号
    unit?: string; // 计量单位
    referencePrice?: number; // 参考单价
    stockQuantity?: number; // 库存数量
    minStockQuantity?: number; // 最低库存
    picUrl?: string; // 物品图片
    status?: number; // 状态
    sort?: number; // 显示顺序
    remark?: string; // 备注
    deptName?: string; // 所属部门
    createTime?: string; // 创建时间
  }
}

/** 查询办公用品分页 */
export function getSupplyItemPage(params: PageParam) {
  return requestClient.get<PageResult<OaSupplyItemApi.SupplyItem>>(
    '/oa/supply-item/page',
    { params },
  );
}

/** 查询可领用物品分页 */
export function getSupplyItemSelectPage(params: PageParam) {
  return requestClient.get<PageResult<OaSupplyItemApi.SupplyItem>>(
    '/oa/supply-item/select-page',
    { params },
  );
}

/** 查询办公用品详情 */
export function getSupplyItem(id: number) {
  return requestClient.get<OaSupplyItemApi.SupplyItem>('/oa/supply-item/get', {
    params: { id },
  });
}

/** 新增办公用品 */
export function createSupplyItem(data: Partial<OaSupplyItemApi.SupplyItem>) {
  return requestClient.post<number>('/oa/supply-item/create', data);
}

/** 修改办公用品 */
export function updateSupplyItem(data: Partial<OaSupplyItemApi.SupplyItem>) {
  return requestClient.put<boolean>('/oa/supply-item/update', data);
}

/** 删除办公用品 */
export function deleteSupplyItem(id: number) {
  return requestClient.delete<boolean>('/oa/supply-item/delete', {
    params: { id },
  });
}

/** 办公用品入库 */
export function stockInSupplyItem(id: number, quantity: number) {
  return requestClient.put<boolean>('/oa/supply-item/stock-in', {
    id,
    quantity,
  });
}
