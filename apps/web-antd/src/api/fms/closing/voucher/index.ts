import { requestClient } from '#/api/request';

export namespace FmsClosingVoucherApi {
  /** 结转凭证生成参数 */
  export interface GenerateReq {
    accountSetId: number; // 账套编号
    month: string; // 会计期间
  }

  /** 结账方案凭证生成参数 */
  export interface SchemeGenerateReq extends GenerateReq {
    id: number; // 方案编号
  }

  /** 结转凭证批量生成参数 */
  export interface BatchGenerateReq extends GenerateReq {
    ids: number[]; // 方案编号数组
  }
}

/** 生成结转损益凭证 */
export function generateProfitLossVoucher(
  data: FmsClosingVoucherApi.GenerateReq,
) {
  return requestClient.post<number>(
    '/fms/closing/voucher/generate-profit-loss',
    data,
  );
}

/** 生成结账方案凭证 */
export function generateClosingSchemeVoucher(
  data: FmsClosingVoucherApi.SchemeGenerateReq,
) {
  return requestClient.post<number>(
    '/fms/closing/voucher/generate-scheme',
    data,
  );
}

/** 批量生成结转凭证 */
export function generateClosingVoucherList(
  data: FmsClosingVoucherApi.BatchGenerateReq,
) {
  return requestClient.post<number[]>(
    '/fms/closing/voucher/generate-list',
    data,
  );
}
