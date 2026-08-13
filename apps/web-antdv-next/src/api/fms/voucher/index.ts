import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace FmsVoucherApi {
  /** 凭证辅助核算项目 */
  export interface VoucherAuxiliaryItem {
    type?: number; // 辅助核算类型
    typeId: number; // 辅助核算类别编号
    itemId: number; // 辅助核算项目编号
    name?: string; // 辅助核算项目名称
  }

  /** 凭证分录 */
  export interface VoucherEntry {
    id?: number; // 分录编号
    digest: string; // 摘要内容
    subjectId: number; // 科目编号
    quantity?: number; // 数量
    unitPrice?: number; // 单价
    debitAmount?: number; // 借方金额
    creditAmount?: number; // 贷方金额
    auxiliaries: VoucherAuxiliaryItem[]; // 辅助核算项目数组
    subjectCode?: string; // 科目编码
    subjectName?: string; // 科目名称
    sort?: number; // 显示顺序
    assistCombinationId?: number; // 辅助核算组合编号
  }

  /** 凭证 */
  export interface Voucher {
    id: number; // 凭证编号
    accountSetId: number; // 账套编号
    voucherWordId: number; // 凭证字编号
    voucherNumber: number; // 凭证号
    voucherTime: number; // 凭证日期时间戳
    attachmentUrls: string[]; // 附件地址数组
    entries: VoucherEntry[]; // 凭证分录数组
    voucherWordName?: string; // 凭证字
    attachmentCount: number; // 附单据张数
    debitAmount: number; // 借方金额
    creditAmount: number; // 贷方金额
    total: number; // 合计金额
    status: number; // 审核状态
    closingGenerated: boolean; // 是否为结账生成凭证
    creatorUserId?: number; // 制单人后台用户编号
    creatorUserName?: string; // 制单人名称
    reviewerUserId?: number; // 审核人后台用户编号
    reviewerUserName?: string; // 审核人名称
    createTime: Date; // 创建时间
  }

  /** 凭证保存参数 */
  export interface SaveReq {
    id?: number; // 凭证编号
    accountSetId: number; // 账套编号
    voucherWordId: number; // 凭证字编号
    voucherNumber: number; // 凭证号
    voucherTime: number; // 凭证日期时间戳
    attachmentCount: number; // 附单据张数
    entries: VoucherEntry[]; // 凭证分录数组
  }

  /** 凭证科目余额 */
  export interface SubjectBalance {
    subjectId: number; // 科目编号
    balanceDirection?: string; // 余额方向
    balance: number; // 余额
  }

  /** 凭证附件修改参数 */
  export interface AttachmentUpdateReq {
    id: number; // 凭证编号
    accountSetId: number; // 账套编号
    attachmentUrls: string[]; // 附件地址数组
  }

  /** 凭证分页查询参数 */
  export interface PageReq extends PageParam {
    accountSetId: number; // 账套编号
    ids?: number[]; // 凭证编号数组
    voucherTime?: string[]; // 凭证日期范围
    voucherWordId?: number; // 凭证字编号
    voucherNumber?: number; // 凭证号
    digest?: string; // 摘要关键词
    subjectId?: number; // 科目编号
    minAmount?: number; // 最小金额
    maxAmount?: number; // 最大金额
    creatorUserId?: number; // 制单人后台用户编号
    status?: number; // 审核状态
  }

  /** 凭证整理参数 */
  export interface TidyReq {
    accountSetId: number; // 账套编号
    month: string; // 整理月份
    voucherWordId?: number; // 凭证字编号
    startNumber: number; // 起始编号
    type: number; // 整理方式
  }

  /** 凭证移动参数 */
  export interface MoveReq {
    accountSetId: number; // 账套编号
    month: string; // 凭证月份
    voucherWordId?: number; // 凭证字编号
    sourceNumber?: number; // 原凭证号
    targetNumber?: number; // 移动到的凭证号
  }

  /** 凭证导入结果 */
  export interface ImportResp {
    totalRowCount: number; // 总分录数
    successRowCount: number; // 成功分录数
    failureRowCount: number; // 失败分录数
    totalVoucherCount: number; // 总凭证数
    successVoucherCount: number; // 成功凭证数
    failureVoucherCount: number; // 失败凭证数
    errorFileUrl?: string; // 错误数据文件地址
  }
}

/** 查询凭证分页 */
export function getVoucherPage(params: FmsVoucherApi.PageReq) {
  return requestClient.get<PageResult<FmsVoucherApi.Voucher>>(
    '/fms/voucher/page',
    { params },
  );
}

/** 查询待打印凭证列表 */
export function getVoucherPrintList(params: FmsVoucherApi.PageReq) {
  return requestClient.get<FmsVoucherApi.Voucher[]>('/fms/voucher/print-list', {
    params,
  });
}

/** 导出凭证 Excel */
export function exportVoucher(params: FmsVoucherApi.PageReq) {
  return requestClient.download('/fms/voucher/export-excel', { params });
}

/** 下载凭证导入模板 */
export function getVoucherImportTemplate(accountSetId: number) {
  return requestClient.download('/fms/voucher/get-import-template', {
    params: { accountSetId },
  });
}

/** 导入凭证 */
export function importVoucher(accountSetId: number, file: File) {
  return requestClient.upload<FmsVoucherApi.ImportResp>('/fms/voucher/import', {
    accountSetId,
    file,
  });
}

/** 查询凭证详情 */
export function getVoucher(accountSetId: number, id: number) {
  return requestClient.get<FmsVoucherApi.Voucher>('/fms/voucher/get', {
    params: { accountSetId, id },
  });
}

/** 查询凭证科目余额列表 */
export function getVoucherSubjectBalanceList(
  accountSetId: number,
  month: string,
) {
  return requestClient.get<FmsVoucherApi.SubjectBalance[]>(
    '/fms/voucher/subject-balance-list',
    { params: { accountSetId, month } },
  );
}

/** 查询凭证辅助核算组合余额 */
export function getVoucherAuxiliaryBalance(
  accountSetId: number,
  month: string,
  subjectId: number,
  auxiliaryItemIds: number[],
) {
  return requestClient.get<FmsVoucherApi.SubjectBalance>(
    '/fms/voucher/auxiliary-balance',
    {
      params: {
        accountSetId,
        month,
        subjectId,
        auxiliaryItemIds: auxiliaryItemIds.join(','),
      },
    },
  );
}

/** 查询下一凭证号 */
export function getNextVoucherNumber(
  accountSetId: number,
  voucherWordId: number,
  voucherTime: string,
) {
  return requestClient.get<number>('/fms/voucher/next-number', {
    params: { accountSetId, voucherWordId, voucherTime },
  });
}

/** 新增凭证 */
export function createVoucher(data: FmsVoucherApi.SaveReq) {
  return requestClient.post<number>('/fms/voucher/create', data);
}

/** 修改凭证 */
export function updateVoucher(data: FmsVoucherApi.SaveReq) {
  return requestClient.put<boolean>('/fms/voucher/update', data);
}

/** 修改凭证附件 */
export function updateVoucherAttachments(
  data: FmsVoucherApi.AttachmentUpdateReq,
) {
  return requestClient.put<boolean>('/fms/voucher/update-attachments', data);
}

/** 批量删除凭证 */
export function deleteVoucherList(accountSetId: number, ids: number[]) {
  return requestClient.delete<boolean>('/fms/voucher/delete-list', {
    params: { accountSetId, ids: ids.join(',') },
  });
}

/** 审核或反审核凭证 */
export function updateVoucherReviewStatus(
  accountSetId: number,
  ids: number[],
  status: number,
) {
  return requestClient.put<boolean>('/fms/voucher/update-review-status', {
    accountSetId,
    ids,
    status,
  });
}

/** 整理凭证 */
export function tidyVoucher(data: FmsVoucherApi.TidyReq) {
  return requestClient.put<boolean>('/fms/voucher/tidy', data);
}

/** 移动凭证 */
export function moveVoucher(data: FmsVoucherApi.MoveReq) {
  return requestClient.put<boolean>('/fms/voucher/move', data);
}
