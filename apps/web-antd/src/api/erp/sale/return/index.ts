import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

namespace ErpSaleReturnApi {
  /** 销售退货信息 */
  export interface SaleReturn {
    id?: number; // 销售退货编号
    no: string; // 销售退货号
    customerId: number; // 客户编号
    returnTime: Date; // 退货时间
    totalCount: number; // 合计数量
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
  }

  /** 销售退货分页查询参数 */
  export interface SaleReturnPageParams extends PageParam {
    no?: string;
    customerId?: number;
    status?: number;
  }

  /** 销售退货状态更新参数 */
  export interface SaleReturnStatusParams {
    id: number;
    status: number;
  }
}

/**
 * 查询销售退货分页
 */
export function getSaleReturnPage(
  params: ErpSaleReturnApi.SaleReturnPageParams,
) {
  return requestClient.get<PageResult<ErpSaleReturnApi.SaleReturn>>(
    '/erp/sale-return/page',
    {
      params,
    },
  );
}

/**
 * 查询销售退货详情
 */
export function getSaleReturn(id: number) {
  return requestClient.get<ErpSaleReturnApi.SaleReturn>(
    `/erp/sale-return/get?id=${id}`,
  );
}

/**
 * 新增销售退货
 */
export function createSaleReturn(data: ErpSaleReturnApi.SaleReturn) {
  return requestClient.post('/erp/sale-return/create', data);
}

/**
 * 修改销售退货
 */
export function updateSaleReturn(data: ErpSaleReturnApi.SaleReturn) {
  return requestClient.put('/erp/sale-return/update', data);
}

/**
 * 更新销售退货的状态
 */
export function updateSaleReturnStatus(
  params: ErpSaleReturnApi.SaleReturnStatusParams,
) {
  return requestClient.put('/erp/sale-return/update-status', null, {
    params,
  });
}

/**
 * 删除销售退货
 */
export function deleteSaleReturn(ids: number[]) {
  return requestClient.delete('/erp/sale-return/delete', {
    params: {
      ids: ids.join(','),
    },
  });
}

/**
 * 导出销售退货 Excel
 */
export function exportSaleReturn(
  params: ErpSaleReturnApi.SaleReturnPageParams,
) {
  return requestClient.download('/erp/sale-return/export-excel', {
    params,
  });
}
