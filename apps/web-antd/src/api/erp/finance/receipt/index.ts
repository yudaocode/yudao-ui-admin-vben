import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

namespace ErpFinanceReceiptApi {
  /** 收款单信息 */
  export interface FinanceReceipt {
    id?: number; // 收款单编号
    no: string; // 收款单号
    customerId: number; // 客户编号
    receiptTime: Date; // 收款时间
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
  }

  /** 收款单分页查询参数 */
  export interface FinanceReceiptPageParams extends PageParam {
    no?: string;
    customerId?: number;
    status?: number;
  }

  /** 收款单状态更新参数 */
  export interface FinanceReceiptStatusParams {
    id: number;
    status: number;
  }
}

/**
 * 查询收款单分页
 */
export function getFinanceReceiptPage(
  params: ErpFinanceReceiptApi.FinanceReceiptPageParams,
) {
  return requestClient.get<PageResult<ErpFinanceReceiptApi.FinanceReceipt>>(
    '/erp/finance-receipt/page',
    {
      params,
    },
  );
}

/**
 * 查询收款单详情
 */
export function getFinanceReceipt(id: number) {
  return requestClient.get<ErpFinanceReceiptApi.FinanceReceipt>(
    `/erp/finance-receipt/get?id=${id}`,
  );
}

/**
 * 新增收款单
 */
export function createFinanceReceipt(
  data: ErpFinanceReceiptApi.FinanceReceipt,
) {
  return requestClient.post('/erp/finance-receipt/create', data);
}

/**
 * 修改收款单
 */
export function updateFinanceReceipt(
  data: ErpFinanceReceiptApi.FinanceReceipt,
) {
  return requestClient.put('/erp/finance-receipt/update', data);
}

/**
 * 更新收款单的状态
 */
export function updateFinanceReceiptStatus(
  params: ErpFinanceReceiptApi.FinanceReceiptStatusParams,
) {
  return requestClient.put('/erp/finance-receipt/update-status', null, {
    params,
  });
}

/**
 * 删除收款单
 */
export function deleteFinanceReceipt(ids: number[]) {
  return requestClient.delete('/erp/finance-receipt/delete', {
    params: {
      ids: ids.join(','),
    },
  });
}

/**
 * 导出收款单 Excel
 */
export function exportFinanceReceipt(
  params: ErpFinanceReceiptApi.FinanceReceiptPageParams,
) {
  return requestClient.download('/erp/finance-receipt/export-excel', {
    params,
  });
}
