import { requestClient } from '#/api/request';

export namespace FmsVoucherStatisticsApi {
  /** 凭证汇总查询参数 */
  export interface StatisticsReq {
    accountSetId: number; // 账套编号
    startMonth: string; // 开始会计期间
    endMonth: string; // 结束会计期间
    voucherWordId?: number; // 凭证字编号
    minVoucherNumber?: number; // 最小凭证号
    maxVoucherNumber?: number; // 最大凭证号
    minLevel?: number; // 最小科目级次
    maxLevel?: number; // 最大科目级次
  }

  /** 凭证汇总信息 */
  export interface Statistics {
    subjectId: number; // 科目编号
    subjectCode: string; // 科目编码
    subjectName: string; // 科目名称
    level: number; // 科目级次
    debitAmount: number; // 借方金额
    creditAmount: number; // 贷方金额
  }
}

/** 查询凭证汇总列表 */
export function getVoucherStatisticsList(
  params: FmsVoucherStatisticsApi.StatisticsReq,
) {
  return requestClient.get<FmsVoucherStatisticsApi.Statistics[]>(
    '/fms/voucher/statistics/list',
    { params },
  );
}

/** 导出凭证汇总 Excel */
export function exportVoucherStatistics(
  params: FmsVoucherStatisticsApi.StatisticsReq,
) {
  return requestClient.download('/fms/voucher/statistics/export-excel', {
    params,
  });
}
