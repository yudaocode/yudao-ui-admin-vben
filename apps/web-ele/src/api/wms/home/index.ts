import { requestClient } from '#/api/request';

export namespace WmsHomeStatisticsApi {
  export interface StatisticsReq {
    goodsLimit?: number;
    warehouseId?: number;
    warehouseLimit?: number;
  }

  export interface OrderStatus {
    count: number;
    status: number;
  }

  export interface OrderSummary {
    statuses: OrderStatus[];
    total: number;
    type: number;
  }

  export interface OrderTrend {
    checkCount: number;
    movementCount: number;
    receiptCount: number;
    shipmentCount: number;
    time: number | string;
  }

  export interface InventoryRankItem {
    id: number;
    name: string;
    quantity: number;
  }

  export interface InventorySummary {
    goodsShareList: InventoryRankItem[];
    totalQuantity: number;
    warehouseDistributionList: InventoryRankItem[];
  }
}

export function getOrderSummary(params?: WmsHomeStatisticsApi.StatisticsReq) {
  return requestClient.get<WmsHomeStatisticsApi.OrderSummary[]>(
    '/wms/home-statistics/order-summary',
    { params },
  );
}

export function getOrderTrend(
  days?: number,
  params?: WmsHomeStatisticsApi.StatisticsReq,
) {
  return requestClient.get<WmsHomeStatisticsApi.OrderTrend[]>(
    '/wms/home-statistics/order-trend',
    { params: { ...params, days } },
  );
}

export function getInventorySummary(
  params?: WmsHomeStatisticsApi.StatisticsReq,
) {
  return requestClient.get<WmsHomeStatisticsApi.InventorySummary>(
    '/wms/home-statistics/inventory-summary',
    { params },
  );
}
