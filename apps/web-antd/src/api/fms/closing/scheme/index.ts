import { requestClient } from '#/api/request';

export namespace FmsClosingSchemeApi {
  /** 结账方案列表查询参数 */
  export interface ListReq {
    accountSetId: number; // 账套编号
    month: string; // 会计期间
  }

  /** 结转损益设置 */
  export interface ProfitLossSettings {
    accountSetId: number; // 账套编号
    voucherWordId?: number; // 凭证字编号
    digest: string; // 凭证摘要
    voucherType: number; // 结转凭证类型
    priorYearAdjustmentSubjectId?: number; // 以前年度损益调整科目编号
    adjustmentClosingSubjectId?: number; // 以前年度损益调整结转科目编号
    otherClosingSubjectId?: number; // 其他损益结转科目编号
    reverseBalance: boolean; // 是否按余额反向结转
    closingDay: number; // 结转日期
  }

  /** 结账方案科目规则 */
  export interface SubjectRule {
    subjectId?: number; // 科目编号
    subjectCode?: string; // 科目编码快照
    digest: string; // 摘要
    direction: number; // 借贷方向
    amountRatio: number; // 金额比例
  }

  /** 结账方案保存参数 */
  export interface SaveReq {
    id?: number; // 方案编号
    accountSetId: number; // 账套编号
    name: string; // 方案名称
    periodEnd: boolean; // 是否期末结转
    subjectId?: number; // 来源科目编号
    formulaRule: number; // 取数规则
    timeType: number; // 取数时间类型
    voucherWordId?: number; // 凭证字编号
    subjects: SubjectRule[]; // 结转科目规则数组
  }

  /** 结账方案 */
  export interface ClosingScheme extends SaveReq {
    id: number; // 方案编号
    type: number; // 方案类型
    digest?: string; // 凭证摘要
    voucherType?: number; // 结转凭证类型
    priorYearAdjustmentSubjectId?: number; // 以前年度损益调整科目编号
    adjustmentClosingSubjectId?: number; // 以前年度损益调整结转科目编号
    otherClosingSubjectId?: number; // 其他损益结转科目编号
    reverseBalance?: boolean; // 是否按余额反向结转
    closingDay?: number; // 结转日期
    balance: number; // 待结转金额
    voucherIds: number[]; // 当前期间已生成凭证编号数组
  }

  /** 专用结转设置 */
  export interface SpecialClosingSettings {
    id: number; // 方案编号
    accountSetId: number; // 账套编号
    voucherWordId?: number; // 凭证字编号
    subjects: SubjectRule[]; // 结转科目规则数组
  }
}

/** 查询结账方案列表 */
export function getClosingSchemeList(params: FmsClosingSchemeApi.ListReq) {
  return requestClient.get<FmsClosingSchemeApi.ClosingScheme[]>(
    '/fms/closing/scheme/list',
    { params },
  );
}

/** 新增结账方案 */
export function createClosingScheme(data: FmsClosingSchemeApi.SaveReq) {
  return requestClient.post<number>('/fms/closing/scheme/create', data);
}

/** 修改结账方案 */
export function updateClosingScheme(data: FmsClosingSchemeApi.SaveReq) {
  return requestClient.put<boolean>('/fms/closing/scheme/update', data);
}

/** 保存结转损益设置 */
export function saveProfitLossSettings(
  data: FmsClosingSchemeApi.ProfitLossSettings,
) {
  return requestClient.put<number>(
    '/fms/closing/scheme/update-profit-loss-settings',
    data,
  );
}

/** 保存专用结转设置 */
export function updateSpecialClosingSettings(
  data: FmsClosingSchemeApi.SpecialClosingSettings,
) {
  return requestClient.put<boolean>(
    '/fms/closing/scheme/update-special-settings',
    data,
  );
}

/** 删除结账方案 */
export function deleteClosingScheme(accountSetId: number, id: number) {
  return requestClient.delete<boolean>('/fms/closing/scheme/delete', {
    params: { accountSetId, id },
  });
}
