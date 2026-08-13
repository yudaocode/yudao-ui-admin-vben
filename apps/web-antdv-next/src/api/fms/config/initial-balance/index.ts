import { requestClient } from '#/api/request';

export namespace FmsInitialBalanceApi {
  /** 初始余额金额信息 */
  export interface Amounts {
    openingAmount: number; // 期初金额
    openingQuantity: number; // 期初数量
    yearDebitAmount: number; // 本年累计借方金额
    yearDebitQuantity: number; // 本年累计借方数量
    yearCreditAmount: number; // 本年累计贷方金额
    yearCreditQuantity: number; // 本年累计贷方数量
    yearOpeningAmount: number; // 年初金额
    yearOpeningQuantity: number; // 年初数量
    profitLossAmount: number; // 实际损益发生额
    profitLossQuantity: number; // 实际损益发生数量
  }

  /** 初始余额 */
  export interface InitialBalance extends Amounts {
    id?: number; // 初始余额编号
    subjectId: number; // 科目编号
    subjectCode: string; // 科目编码
    subjectName: string; // 科目名称
    parentId?: number; // 上级科目编号
    type: number; // 科目类型
    balanceDirection: number; // 余额方向
    quantityAccounting: boolean; // 是否启用数量核算
    quantityUnit?: string; // 数量单位
    auxiliaryAccounting: boolean; // 是否启用辅助核算
    auxiliaryConfigs: AuxiliaryConfig[]; // 辅助核算配置数组
    assistBalances: AssistBalance[]; // 辅助核算余额数组
  }

  /** 初始余额辅助核算配置，等价后端 FmsInitialBalanceRespVO.AuxiliaryConfig */
  export interface AuxiliaryConfig {
    auxiliaryTypeId: number; // 辅助核算类别编号
    type: number; // 辅助核算类型
    name: string; // 辅助核算类别名称
  }

  /** 初始余额辅助核算余额，等价后端 FmsInitialBalanceRespVO.AssistBalance */
  export interface AssistBalance extends Amounts {
    assistCombinationId?: number; // 辅助核算组合编号
    auxiliaries: AuxiliaryItem[]; // 辅助核算项目数组
  }

  /** 初始余额辅助核算项目，等价后端 FmsInitialBalanceRespVO.AuxiliaryItem */
  export interface AuxiliaryItem {
    type: number; // 辅助核算类型
    typeId: number; // 辅助核算类别编号
    itemId: number; // 辅助核算项目编号
    name: string; // 辅助核算项目名称
  }

  /** 初始余额修改参数 */
  export interface UpdateReq extends Amounts {
    subjectId: number; // 科目编号
    assistBalances: AssistUpdateReq[]; // 辅助核算余额数组
  }

  /** 初始余额辅助核算修改参数，等价后端 FmsInitialBalanceSaveReqVO.AssistBalance */
  export interface AssistUpdateReq extends Amounts {
    auxiliaryItemIds: number[]; // 辅助核算项目编号数组
  }

  /** 试算平衡结果 */
  export interface TrialBalance {
    openingDebitAmount: number; // 期初借方金额
    openingCreditAmount: number; // 期初贷方金额
    openingDifferenceAmount: number; // 期初差额
    yearDebitAmount: number; // 本年累计借方金额
    yearCreditAmount: number; // 本年累计贷方金额
    yearDifferenceAmount: number; // 本年累计差额
    balanced: boolean; // 是否平衡
  }
}

/** 查询初始余额列表 */
export function getInitialBalanceList(
  accountSetId: number,
  subjectType: number,
) {
  return requestClient.get<FmsInitialBalanceApi.InitialBalance[]>(
    '/fms/config/initial-balance/list',
    { params: { accountSetId, subjectType } },
  );
}

/** 保存初始余额 */
export function saveInitialBalance(
  accountSetId: number,
  balances: FmsInitialBalanceApi.UpdateReq[],
) {
  return requestClient.put<boolean>('/fms/config/initial-balance/save', {
    accountSetId,
    balances,
  });
}

/** 查询试算平衡结果 */
export function getTrialBalance(accountSetId: number) {
  return requestClient.get<FmsInitialBalanceApi.TrialBalance>(
    '/fms/config/initial-balance/trial-balance',
    { params: { accountSetId } },
  );
}

/** 导出初始余额 Excel */
export function exportInitialBalance(accountSetId: number) {
  return requestClient.download('/fms/config/initial-balance/export-excel', {
    params: { accountSetId },
  });
}

/** 下载初始余额导入模板 */
export function getInitialBalanceImportTemplate(accountSetId: number) {
  return requestClient.download(
    '/fms/config/initial-balance/get-import-template',
    { params: { accountSetId } },
  );
}

/** 导入初始余额 */
export function importInitialBalance(accountSetId: number, file: File) {
  return requestClient.upload<number>('/fms/config/initial-balance/import', {
    accountSetId,
    file,
  });
}
