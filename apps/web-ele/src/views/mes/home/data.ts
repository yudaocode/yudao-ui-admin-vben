import type { MesHomeApi } from '#/api/mes/home';

import { MesProWorkOrderStatusEnum } from '@vben/constants';

/** 首页汇总统计默认值 */
export const defaultSummary: MesHomeApi.Summary = {
  andonActiveCount: 0,
  machineryMaintenance: 0,
  machineryProducing: 0,
  machineryStop: 0,
  machineryTotal: 0,
  repairActiveCount: 0,
  todayOutput: 0,
  todayQualifiedQuantity: 0,
  todayUnqualifiedQuantity: 0,
  workOrderActiveCount: 0,
  workOrderFinishedCount: 0,
  workOrderPrepareCount: 0,
  yesterdayOutput: 0,
};

/** 工单状态对应的颜色映射 */
export const WORK_ORDER_STATUS_COLOR_MAP: Record<number, string> = {
  [MesProWorkOrderStatusEnum.PREPARE]: '#909399', // 草稿
  [MesProWorkOrderStatusEnum.CONFIRMED]: '#409EFF', // 已确认
  [MesProWorkOrderStatusEnum.FINISHED]: '#67C23A', // 已完成
  [MesProWorkOrderStatusEnum.CANCELED]: '#F56C6C', // 已取消
};
