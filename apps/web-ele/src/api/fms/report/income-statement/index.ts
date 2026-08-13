import type { FmsReportApi } from '#/api/fms/report';

import { requestClient } from '#/api/request';

export namespace FmsIncomeStatementApi {
  /** 利润表检查结果 */
  export interface IncomeStatementCheck {
    balanced?: boolean; // 净利润与未分配利润变动是否一致
    differenceAmount?: number; // 利润表与资产负债表勾稽差额
    unmappedSubjects: FmsReportApi.UnmappedSubject[]; // 未纳入报表公式的科目数组
  }
}

/** 查询利润表 */
export function getIncomeStatement(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsReportApi.ReportItem[]>(
    '/fms/report/income-statement/get',
    { params },
  );
}

/** 导出利润表 Excel */
export function exportIncomeStatement(params: FmsReportApi.ListReq) {
  return requestClient.download('/fms/report/income-statement/export-excel', {
    params,
  });
}

/** 修改利润表公式 */
export function updateIncomeStatementFormula(
  data: FmsReportApi.FormulaUpdateReq,
) {
  return requestClient.put<boolean>('/fms/report/income-statement/update', data);
}

/** 检查利润表 */
export function checkIncomeStatement(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsIncomeStatementApi.IncomeStatementCheck>(
    '/fms/report/income-statement/check',
    { params },
  );
}
