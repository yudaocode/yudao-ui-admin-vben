import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

namespace ErpFinancePaymentApi {
  /** 付款单信息 */
  export interface FinancePayment {
    id?: number; // 付款单编号
    no: string; // 付款单号
    supplierId: number; // 供应商编号
    paymentTime: Date; // 付款时间
    totalPrice: number; // 合计金额，单位：元
    status: number; // 状态
    remark: string; // 备注
  }

  /** 付款单分页查询参数 */
  export interface FinancePaymentPageParams extends PageParam {
    no?: string;
    supplierId?: number;
    status?: number;
  }

  /** 付款单状态更新参数 */
  export interface FinancePaymentStatusParams {
    id: number;
    status: number;
  }
}

/**
 * 查询付款单分页
 */
export function getFinancePaymentPage(
  params: ErpFinancePaymentApi.FinancePaymentPageParams,
) {
  return requestClient.get<PageResult<ErpFinancePaymentApi.FinancePayment>>(
    '/erp/finance-payment/page',
    {
      params,
    },
  );
}

/**
 * 查询付款单详情
 */
export function getFinancePayment(id: number) {
  return requestClient.get<ErpFinancePaymentApi.FinancePayment>(
    `/erp/finance-payment/get?id=${id}`,
  );
}

/**
 * 新增付款单
 */
export function createFinancePayment(
  data: ErpFinancePaymentApi.FinancePayment,
) {
  return requestClient.post('/erp/finance-payment/create', data);
}

/**
 * 修改付款单
 */
export function updateFinancePayment(
  data: ErpFinancePaymentApi.FinancePayment,
) {
  return requestClient.put('/erp/finance-payment/update', data);
}

/**
 * 更新付款单的状态
 */
export function updateFinancePaymentStatus(
  params: ErpFinancePaymentApi.FinancePaymentStatusParams,
) {
  return requestClient.put('/erp/finance-payment/update-status', null, {
    params,
  });
}

/**
 * 删除付款单
 */
export function deleteFinancePayment(ids: number[]) {
  return requestClient.delete('/erp/finance-payment/delete', {
    params: {
      ids: ids.join(','),
    },
  });
}

/**
 * 导出付款单 Excel
 */
export function exportFinancePayment(
  params: ErpFinancePaymentApi.FinancePaymentPageParams,
) {
  return requestClient.download('/erp/finance-payment/export-excel', {
    params,
  });
}
