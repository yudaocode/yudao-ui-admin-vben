import { requestClient } from '#/api/request';

export namespace MesHomeApi {
  /** MES 首页汇总统计 */
  export interface Summary {
    workOrderActiveCount: number; // 进行中工单数
    workOrderPrepareCount: number; // 待排产工单数
    workOrderFinishedCount: number; // 已完成工单数
    todayOutput: number; // 今日产量
    yesterdayOutput: number; // 昨日产量
    todayQualifiedQuantity: number; // 今日合格品数
    todayUnqualifiedQuantity: number; // 今日不良品数
    machineryTotal: number; // 设备总数
    machineryProducing: number; // 生产中设备数
    machineryStop: number; // 停机设备数
    machineryMaintenance: number; // 维护中设备数
    andonActiveCount: number; // 未处置安灯呼叫数
    repairActiveCount: number; // 待处理维修工单数
  }

  /** MES 工单状态分布 */
  export interface WorkOrderStatus {
    status: number; // 工单状态
    statusName: string; // 工单状态名称
    count: number; // 数量
  }

  /** MES 生产趋势 */
  export interface ProductionTrend {
    date: string; // 日期
    quantity: number; // 产量
    qualifiedQuantity: number; // 合格品数
    unqualifiedQuantity: number; // 不良品数
  }
}

/** 获得首页汇总统计 */
export function getHomeSummary() {
  return requestClient.get<MesHomeApi.Summary>('/mes/home-statistics/summary');
}

/** 获得工单状态分布 */
export function getWorkOrderStatusDistribution() {
  return requestClient.get<MesHomeApi.WorkOrderStatus[]>(
    '/mes/home-statistics/work-order-status',
  );
}

/** 获得生产趋势 */
export function getProductionTrend(days?: number) {
  return requestClient.get<MesHomeApi.ProductionTrend[]>(
    '/mes/home-statistics/production-trend',
    { params: { days } },
  );
}
