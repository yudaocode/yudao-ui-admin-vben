import type { FmsReportApi } from '#/api/fms/report';

import { requestClient } from '#/api/request';

export namespace FmsBalanceSheetApi {
  /** 资产负债表行信息 */
  export interface BalanceSheetRow {
    rowId: number; // 行编号
    assetId?: number; // 资产项目配置编号
    assetName?: string; // 资产项目名称
    assetRowNo?: number; // 资产项目行次
    assetClosingAmount?: number; // 资产项目期末余额
    assetOpeningAmount?: number; // 资产项目年初余额
    assetLevel?: number; // 资产项目层级
    assetEditable?: boolean; // 资产项目是否可编辑
    assetFormula?: string; // 资产项目公式
    liabilityId?: number; // 负债和所有者权益项目配置编号
    liabilityName?: string; // 负债和所有者权益项目名称
    liabilityRowNo?: number; // 负债和所有者权益项目行次
    liabilityClosingAmount?: number; // 负债和所有者权益项目期末余额
    liabilityOpeningAmount?: number; // 负债和所有者权益项目年初余额
    liabilityLevel?: number; // 负债和所有者权益项目层级
    liabilityEditable?: boolean; // 负债和所有者权益项目是否可编辑
    liabilityFormula?: string; // 负债和所有者权益项目公式
  }

  /** 资产负债表检查结果 */
  export interface BalanceSheetCheck {
    balanced?: boolean; // 报表是否平衡
    initialBalanceBalanced?: boolean; // 初始余额是否平衡
    profitLossTransferred?: boolean; // 损益是否已结转
    openingDifferenceAmount?: number; // 年初余额差额
    closingDifferenceAmount?: number; // 期末余额差额
    unmappedSubjects: FmsReportApi.UnmappedSubject[]; // 未纳入报表公式的科目数组
  }
}

/** 查询资产负债表 */
export function getBalanceSheet(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsBalanceSheetApi.BalanceSheetRow[]>(
    '/fms/report/balance-sheet/get',
    { params },
  );
}

/** 导出资产负债表 Excel */
export function exportBalanceSheet(params: FmsReportApi.ListReq) {
  return requestClient.download('/fms/report/balance-sheet/export-excel', {
    params,
  });
}

/** 修改资产负债表公式 */
export function updateBalanceSheetFormula(data: FmsReportApi.FormulaUpdateReq) {
  return requestClient.put<boolean>('/fms/report/balance-sheet/update', data);
}

/** 检查资产负债表 */
export function checkBalanceSheet(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsBalanceSheetApi.BalanceSheetCheck>(
    '/fms/report/balance-sheet/check',
    { params },
  );
}
