import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesWmPackageLineApi {
  /** 装箱明细 */
  export interface PackageLine {
    id?: number; // 装箱明细编号
    packageId?: number; // 装箱单编号
    materialStockId?: number; // 库存编号
    itemId?: number; // 产品物料编号
    itemCode?: string; // 产品物料编码
    itemName?: string; // 产品物料名称
    specification?: string; // 规格型号
    unitMeasureName?: string; // 计量单位名称
    quantity?: number; // 装箱数量
    workOrderId?: number; // 生产工单编号
    workOrderCode?: string; // 生产工单编号
    batchCode?: string; // 批次号
    expireDate?: number; // 有效期
    remark?: string; // 备注
    createTime?: string; // 创建时间
  }
}

/** 查询装箱明细分页 */
export function getPackageLinePage(params: PageParam) {
  return requestClient.get<PageResult<MesWmPackageLineApi.PackageLine>>(
    '/mes/wm/package-line/page',
    { params },
  );
}

/** 查询装箱明细详情 */
export function getPackageLine(id: number) {
  return requestClient.get<MesWmPackageLineApi.PackageLine>(
    `/mes/wm/package-line/get?id=${id}`,
  );
}

/** 新增装箱明细 */
export function createPackageLine(data: MesWmPackageLineApi.PackageLine) {
  return requestClient.post('/mes/wm/package-line/create', data);
}

/** 修改装箱明细 */
export function updatePackageLine(data: MesWmPackageLineApi.PackageLine) {
  return requestClient.put('/mes/wm/package-line/update', data);
}

/** 删除装箱明细 */
export function deletePackageLine(id: number) {
  return requestClient.delete(`/mes/wm/package-line/delete?id=${id}`);
}
