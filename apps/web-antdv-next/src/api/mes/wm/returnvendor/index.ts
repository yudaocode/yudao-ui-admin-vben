import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmReturnVendorApi {
  /** MES 供应商退货单 */
  export interface ReturnVendor {
    id?: number; // 退货单编号
    code?: string; // 退货单编号
    name?: string; // 退货单名称
    purchaseOrderCode?: string; // 采购订单号
    vendorId?: number; // 供应商编号
    vendorCode?: string; // 供应商编码
    vendorName?: string; // 供应商名称
    vendorNickname?: string; // 供应商简称
    returnDate?: number; // 退货日期
    returnReason?: string; // 退货原因
    transportCode?: string; // 运单号
    transportTelephone?: string; // 联系电话
    status?: number; // 单据状态
    remark?: string; // 备注
    createTime?: Date; // 创建时间
  }
}

/** 查询供应商退货单分页 */
export function getReturnVendorPage(params: PageParam) {
  return requestClient.get<PageResult<MesWmReturnVendorApi.ReturnVendor>>(
    '/mes/wm/return-vendor/page',
    { params },
  );
}

/** 查询供应商退货单详情 */
export function getReturnVendor(id: number) {
  return requestClient.get<MesWmReturnVendorApi.ReturnVendor>(
    `/mes/wm/return-vendor/get?id=${id}`,
  );
}

/** 新增供应商退货单 */
export function createReturnVendor(data: MesWmReturnVendorApi.ReturnVendor) {
  return requestClient.post<number>('/mes/wm/return-vendor/create', data);
}

/** 修改供应商退货单 */
export function updateReturnVendor(data: MesWmReturnVendorApi.ReturnVendor) {
  return requestClient.put('/mes/wm/return-vendor/update', data);
}

/** 删除供应商退货单 */
export function deleteReturnVendor(id: number) {
  return requestClient.delete(`/mes/wm/return-vendor/delete?id=${id}`);
}

/** 提交供应商退货单 */
export function submitReturnVendor(id: number) {
  return requestClient.put(`/mes/wm/return-vendor/submit?id=${id}`);
}

/** 执行拣货 */
export function stockReturnVendor(id: number) {
  return requestClient.put(`/mes/wm/return-vendor/stock?id=${id}`);
}

/** 完成供应商退货单 */
export function finishReturnVendor(id: number) {
  return requestClient.put(`/mes/wm/return-vendor/finish?id=${id}`);
}

/** 取消供应商退货单 */
export function cancelReturnVendor(id: number) {
  return requestClient.put(`/mes/wm/return-vendor/cancel?id=${id}`);
}

/** 校验供应商退货单拣货数量是否与退货数量一致 */
export function checkReturnVendorQuantity(id: number) {
  return requestClient.get<boolean>(
    `/mes/wm/return-vendor/check-quantity?id=${id}`,
  );
}

/** 导出供应商退货单 */
export function exportReturnVendor(params: any) {
  return requestClient.download('/mes/wm/return-vendor/export-excel', {
    params,
  });
}
