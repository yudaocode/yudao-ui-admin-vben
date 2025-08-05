import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

namespace ErpPurchaseInApi {
  /** 采购入库信息 */
  export interface PurchaseIn {
    id?: number; // 入库工单编号
    no: string; // 采购入库号
    supplierId: number; // 供应商编号
    inTime: Date; // 入库时间
    totalCount: number; // 合计数量
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
    outCount: number; // 采购出库数量
    returnCount: number; // 采购退货数量
  }

  /** 采购入库分页查询参数 */
  export interface PurchaseInPageParams extends PageParam {
    no?: string;
    supplierId?: number;
    status?: number;
  }

  /** 采购入库状态更新参数 */
  export interface PurchaseInStatusParams {
    id: number;
    status: number;
  }
}

/**
 * 查询采购入库分页
 */
export function getPurchaseInPage(
  params: ErpPurchaseInApi.PurchaseInPageParams,
) {
  return requestClient.get<PageResult<ErpPurchaseInApi.PurchaseIn>>(
    '/erp/purchase-in/page',
    {
      params,
    },
  );
}

/**
 * 查询采购入库详情
 */
export function getPurchaseIn(id: number) {
  return requestClient.get<ErpPurchaseInApi.PurchaseIn>(
    `/erp/purchase-in/get?id=${id}`,
  );
}

/**
 * 新增采购入库
 */
export function createPurchaseIn(data: ErpPurchaseInApi.PurchaseIn) {
  return requestClient.post('/erp/purchase-in/create', data);
}

/**
 * 修改采购入库
 */
export function updatePurchaseIn(data: ErpPurchaseInApi.PurchaseIn) {
  return requestClient.put('/erp/purchase-in/update', data);
}

/**
 * 更新采购入库的状态
 */
export function updatePurchaseInStatus(
  params: ErpPurchaseInApi.PurchaseInStatusParams,
) {
  return requestClient.put('/erp/purchase-in/update-status', null, {
    params,
  });
}

/**
 * 删除采购入库
 */
export function deletePurchaseIn(ids: number[]) {
  return requestClient.delete('/erp/purchase-in/delete', {
    params: {
      ids: ids.join(','),
    },
  });
}

/**
 * 导出采购入库 Excel
 */
export function exportPurchaseIn(
  params: ErpPurchaseInApi.PurchaseInPageParams,
) {
  return requestClient.download('/erp/purchase-in/export-excel', {
    params,
  });
}
