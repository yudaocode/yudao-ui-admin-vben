import type { FmsReportApi } from '#/api/fms/report';

import { requestClient } from '#/api/request';

export namespace FmsCashFlowStatementApi {
  /** 现金流量表检查结果 */
  export interface CashFlowCheck {
    balanced?: boolean; // 资产负债表是否平衡
    initialBalanceBalanced?: boolean; // 初始余额是否平衡
    profitLossTransferred?: boolean; // 损益是否已结转
    balanceSheetReady?: boolean; // 资产负债表是否满足现金流量表取数条件
    openingDifferenceAmount?: number; // 年初余额差额
    closingDifferenceAmount?: number; // 期末余额差额
    unmappedSubjects: FmsReportApi.UnmappedSubject[]; // 未纳入报表公式的科目数组
  }

  /** 现金流量辅助数据信息 */
  export interface CashFlowAdjustment {
    id: number; // 数据编号
    name: string; // 项目名称
    rowNo: number; // 行次
    formula: string; // 公式
    remark?: string; // 说明
    editable: boolean; // 是否可编辑
    currentAmount: number; // 本期金额
    yearAmount: number; // 本年累计金额
    level: number; // 层级
  }

  /** 现金流量表修改项参数 */
  export interface CashFlowStatementUpdateItemReq {
    id: number; // 报表项目编号
    currentAmount: number; // 本期金额
    yearAmount: number; // 本年累计金额
  }

  /** 现金流量表修改参数 */
  export interface CashFlowStatementUpdateReq extends FmsReportApi.ListReq {
    items: CashFlowStatementUpdateItemReq[]; // 现金流量表项目数组
  }

  /** 现金流量辅助数据修改项参数 */
  export interface CashFlowAdjustmentUpdateItemReq {
    id: number; // 数据编号
    currentAmount: number; // 本期金额
    yearAmount: number; // 本年累计金额
  }

  /** 现金流量辅助数据修改参数 */
  export interface CashFlowAdjustmentUpdateReq {
    accountSetId: number; // 账套编号
    items: CashFlowAdjustmentUpdateItemReq[]; // 辅助数据项数组
  }
}

/** 查询现金流量表 */
export function getCashFlowStatement(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsReportApi.ReportItem[]>(
    '/fms/report/cash-flow-statement/get',
    { params },
  );
}

/** 修改现金流量表 */
export function updateCashFlowStatement(
  data: FmsCashFlowStatementApi.CashFlowStatementUpdateReq,
) {
  return requestClient.put<boolean>('/fms/report/cash-flow-statement/update', data);
}

/** 导出现金流量表 Excel */
export function exportCashFlowStatement(params: FmsReportApi.ListReq) {
  return requestClient.download(
    '/fms/report/cash-flow-statement/export-excel',
    { params },
  );
}

/** 检查现金流量表 */
export function checkCashFlowStatement(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsCashFlowStatementApi.CashFlowCheck>(
    '/fms/report/cash-flow-statement/check',
    { params },
  );
}

/** 查询现金流量辅助数据列表 */
export function getCashFlowAdjustmentList(params: FmsReportApi.ListReq) {
  return requestClient.get<FmsCashFlowStatementApi.CashFlowAdjustment[]>(
    '/fms/report/cash-flow-statement/adjustment/list',
    { params },
  );
}

/** 修改现金流量辅助数据 */
export function updateCashFlowAdjustment(
  data: FmsCashFlowStatementApi.CashFlowAdjustmentUpdateReq,
) {
  return requestClient.put<boolean>(
    '/fms/report/cash-flow-statement/adjustment/update',
    data,
  );
}

/** 修改现金流量辅助数据公式 */
export function updateCashFlowAdjustmentFormula(
  data: FmsReportApi.FormulaUpdateReq,
) {
  return requestClient.put<boolean>(
    '/fms/report/cash-flow-statement/adjustment/update-formula',
    data,
  );
}
