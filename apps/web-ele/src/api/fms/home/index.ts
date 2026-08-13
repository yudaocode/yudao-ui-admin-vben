import { requestClient } from '#/api/request';

export namespace FmsHomeApi {
  /** FMS 首页指标信息 */
  export interface HomeMetric {
    key: string; // 指标标识
    name: string; // 指标名称
    amount: number; // 指标金额
  }

  /** FMS 首页指标趋势信息 */
  export interface HomeTrend {
    month: string; // 会计期间
    metrics: HomeMetric[]; // 动态财务指标
    income: number; // 收入
    operatingCost: number; // 成本
    profit: number; // 利润
    expense: number; // 费用
    other: number; // 其他
  }

  /** FMS 首页信息 */
  export interface Home {
    currentMonth: string; // 当前会计期间
    metrics: HomeMetric[]; // 当期财务指标数组
    trends: HomeTrend[]; // 财务指标趋势数组
  }

  /** FMS 首页指标趋势明细信息 */
  export interface HomeMetricTrend {
    month: string; // 会计期间
    amount: number; // 指标金额
  }

  /** FMS 首页指标科目构成信息 */
  export interface HomeMetricStructure {
    subjectId: number; // 科目编号
    subjectCode: string; // 科目编码
    subjectName: string; // 科目名称
    amount: number; // 科目金额
  }

  /** FMS 首页指标明细信息 */
  export interface HomeMetricDetail {
    key: string; // 指标标识
    name: string; // 指标名称
    trends: HomeMetricTrend[]; // 财务指标趋势数组
    structure: HomeMetricStructure[]; // 当期科目构成数组
  }
}

/** 查询首页数据 */
export function getHome(accountSetId: number) {
  return requestClient.get<FmsHomeApi.Home>('/fms/home/get', {
    params: { accountSetId },
  });
}

/** 查询首页财务指标明细 */
export function getHomeMetricDetail(accountSetId: number, metricKey: string) {
  return requestClient.get<FmsHomeApi.HomeMetricDetail>(
    '/fms/home/metric-detail',
    { params: { accountSetId, metricKey } },
  );
}
