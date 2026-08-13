import { requestClient } from '#/api/request';

export namespace FmsSubjectApi {
  /** 科目 */
  export interface Subject {
    id?: number; // 科目编号
    accountSetId: number; // 账套编号
    code: string; // 科目编码
    name: string; // 科目名称
    parentId?: number; // 上级科目编号
    type?: number; // 科目类型
    category?: number; // 科目类别
    balanceDirection?: number; // 余额方向
    auxiliaryTypeIds: number[]; // 辅助核算类别编号数组
    auxiliaryTypeNames?: string[]; // 辅助核算类别名称数组
    currencyIds: number[]; // 外币核算币别编号数组
    quantityAccounting: boolean; // 是否启用数量核算
    quantityUnit?: string; // 数量单位
    cash: boolean; // 是否现金及现金等价物
    migrateParentData?: boolean; // 是否迁移上级科目历史数据
    auxiliaryMappings?: AuxiliaryMapping[]; // 辅助核算历史数据迁移项目数组
    status?: number; // 状态
    level?: number; // 层级
    children?: Subject[]; // 子级科目数组，由前端按需生成
    createTime?: Date; // 创建时间
  }

  /** 科目辅助核算历史数据迁移项目 */
  export interface AuxiliaryMapping {
    typeId: number; // 辅助核算类别编号
    itemId?: number; // 辅助核算项目编号
  }

  /** 科目状态修改参数 */
  export interface StatusReq {
    accountSetId: number; // 账套编号
    ids: number[]; // 科目编号数组
    status: number; // 状态
  }

  /** 科目使用情况 */
  export interface Usage {
    childCount: number; // 下级科目数量
    voucherEntryCount: number; // 凭证分录数量
    initialBalanceCount: number; // 初始余额数量
    auxiliaryCombinationCount: number; // 辅助核算组合数量
    quantityDataCount: number; // 包含数量数据的记录数量
    used: boolean; // 是否已被业务使用
  }

  /** 科目导入结果 */
  export interface ImportResp {
    totalCount: number; // 总数量
    successSubjectCodes: string[]; // 成功科目编码数组
    failureReasons: Record<string, string>; // 失败原因 Map
  }
}

/** 查询科目列表 */
export function getSubjectList(accountSetId: number, type?: number) {
  return requestClient.get<FmsSubjectApi.Subject[]>('/fms/config/subject/list', {
    params: { accountSetId, type },
  });
}

/** 查询科目精简列表 */
export function getSubjectSimpleList(accountSetId: number, type?: number) {
  return requestClient.get<FmsSubjectApi.Subject[]>(
    '/fms/config/subject/simple-list',
    { params: { accountSetId, type } },
  );
}

/** 查询指定期间有发生额的科目精简列表 */
export function getDetailSubjectList(params: {
  accountSetId: number;
  endMonth: string;
  startMonth: string;
}) {
  return requestClient.get<FmsSubjectApi.Subject[]>(
    '/fms/ledger/detail/subject-list',
    { params },
  );
}

/** 查询科目详情 */
export function getSubject(accountSetId: number, id: number) {
  return requestClient.get<FmsSubjectApi.Subject>('/fms/config/subject/get', {
    params: { accountSetId, id },
  });
}

/** 查询科目使用情况 */
export function getSubjectUsage(accountSetId: number, id: number) {
  return requestClient.get<FmsSubjectApi.Usage>(
    '/fms/config/subject/get-usage',
    { params: { accountSetId, id } },
  );
}

/** 新增科目 */
export function createSubject(data: FmsSubjectApi.Subject) {
  return requestClient.post<number>('/fms/config/subject/create', data);
}

/** 修改科目 */
export function updateSubject(data: FmsSubjectApi.Subject) {
  return requestClient.put<boolean>('/fms/config/subject/update', data);
}

/** 批量删除科目 */
export function deleteSubjectList(accountSetId: number, ids: number[]) {
  return requestClient.delete<boolean>('/fms/config/subject/delete-list', {
    data: { accountSetId, ids },
  });
}

/** 修改科目状态 */
export function updateSubjectStatus(data: FmsSubjectApi.StatusReq) {
  return requestClient.put<boolean>('/fms/config/subject/update-status', data);
}

/** 导出科目 Excel */
export function exportSubject(accountSetId: number, type?: number) {
  return requestClient.download('/fms/config/subject/export-excel', {
    params: { accountSetId, type },
  });
}

/** 下载科目导入模板 */
export function getSubjectImportTemplate() {
  return requestClient.download('/fms/config/subject/get-import-template');
}

/** 导入科目 */
export function importSubject(accountSetId: number, file: File) {
  return requestClient.upload<FmsSubjectApi.ImportResp>(
    '/fms/config/subject/import',
    { accountSetId, file },
  );
}
