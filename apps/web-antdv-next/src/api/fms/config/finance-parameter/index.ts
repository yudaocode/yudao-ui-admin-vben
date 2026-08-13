import { requestClient } from '#/api/request';

export namespace FmsFinanceParameterApi {
  /** 财务参数 */
  export interface FinanceParameter {
    accountSetId: number; // 账套编号
    standard?: number; // 会计制度
    level: number; // 科目层级
    subjectCodeRule: string; // 科目编码规则
    ledgerBalanceMode: number; // 账簿余额方向模式
    voucherReviewRequired: boolean; // 结账前是否要求凭证审核
  }
}

/** 查询财务参数 */
export function getFinanceParameter(accountSetId: number) {
  return requestClient.get<FmsFinanceParameterApi.FinanceParameter | null>(
    '/fms/config/finance-parameter/get',
    { params: { accountSetId } },
  );
}

/** 修改财务参数 */
export function updateFinanceParameter(
  data: FmsFinanceParameterApi.FinanceParameter,
) {
  return requestClient.put<boolean>('/fms/config/finance-parameter/update', data);
}
