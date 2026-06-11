import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmPackageApi {
  /** 装箱单 */
  export interface Package {
    id?: number; // 装箱单编号
    code?: string; // 装箱单编码
    parentId?: number; // 父箱编号
    packageDate?: number; // 装箱日期
    salesOrderCode?: string; // 销售订单编号
    invoiceCode?: string; // 发票编号
    clientId?: number; // 客户编号
    clientCode?: string; // 客户编码
    clientName?: string; // 客户名称
    clientNickname?: string; // 客户简称
    length?: number; // 箱长度
    width?: number; // 箱宽度
    height?: number; // 箱高度
    sizeUnitId?: number; // 尺寸单位编号
    sizeUnitName?: string; // 尺寸单位名称
    netWeight?: number; // 净重
    grossWeight?: number; // 毛重
    weightUnitId?: number; // 重量单位编号
    weightUnitName?: string; // 重量单位名称
    inspectorUserId?: number; // 检查员用户编号
    inspectorName?: string; // 检查员名称
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: string; // 创建时间
    children?: Package[]; // 子箱列表
  }
}

/** 查询装箱单分页 */
export function getPackagePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmPackageApi.Package>>(
    '/mes/wm/package/page',
    { params },
  );
}

/** 查询装箱单详情 */
export function getPackage(id: number) {
  return requestClient.get<MesWmPackageApi.Package>(
    `/mes/wm/package/get?id=${id}`,
  );
}

/** 新增装箱单 */
export function createPackage(data: MesWmPackageApi.Package) {
  return requestClient.post<number>('/mes/wm/package/create', data);
}

/** 修改装箱单 */
export function updatePackage(data: MesWmPackageApi.Package) {
  return requestClient.put('/mes/wm/package/update', data);
}

/** 删除装箱单 */
export function deletePackage(id: number) {
  return requestClient.delete(`/mes/wm/package/delete?id=${id}`);
}

/** 完成装箱单 */
export function finishPackage(id: number) {
  return requestClient.put(`/mes/wm/package/finish?id=${id}`);
}

/** 添加子箱 */
export function addChildPackage(parentId: number, childId: number) {
  return requestClient.put('/mes/wm/package/add-child-package', null, {
    params: { childId, parentId },
  });
}

/** 移除子箱 */
export function removeChildPackage(childId: number) {
  return requestClient.put(
    `/mes/wm/package/remove-child-package?childId=${childId}`,
  );
}
