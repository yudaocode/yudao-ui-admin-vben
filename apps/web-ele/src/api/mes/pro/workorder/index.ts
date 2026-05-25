import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace MesProWorkOrderApi {
  /** MES 生产工单 */
  export interface WorkOrder {
    id?: number;
    code?: string; // 工单编码
    name?: string; // 工单名称
    type?: number; // 工单类型
    status?: number; // 工单状态
    sourceType?: number;
    productId?: number; // 产品物料编号
    productCode?: string;
    productName?: string;
    productSpecification?: string;
    quantity?: number;
    unitName?: string;
    routeId?: number;
    routeName?: string;
    clientId?: number;
    clientName?: string;
    planStartTime?: number | string;
    planEndTime?: number | string;
    actualStartTime?: number | string;
    actualEndTime?: number | string;
    remark?: string;
    createTime?: number | string;
  }

  export interface PageParams extends PageParam {
    code?: string;
    name?: string;
    status?: number;
    type?: number;
  }
}

/** 查询生产工单分页 */
export function getWorkOrderPage(params: MesProWorkOrderApi.PageParams) {
  return requestClient.get<PageResult<MesProWorkOrderApi.WorkOrder>>(
    '/mes/pro/work-order/page',
    { params },
  );
}

/** 查询生产工单详情 */
export function getWorkOrder(id: number) {
  return requestClient.get<MesProWorkOrderApi.WorkOrder>(
    `/mes/pro/work-order/get?id=${id}`,
  );
}
