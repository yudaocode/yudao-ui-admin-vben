import { requestClient } from '#/api/request';

export namespace MesProRouteProductApi {
  /** MES 工艺路线产品 */
  export interface RouteProduct {
    id?: number;
    routeId?: number;
    itemId?: number;
    itemCode?: string;
    itemName?: string;
    specification?: string;
    unitName?: string;
    quantity?: number;
    productionTime?: number;
    timeUnitType?: string;
    remark?: string;
    createTime?: Date;
  }
}

/** 按工艺路线查询产品列表 */
export function getRouteProductListByRoute(routeId: number) {
  return requestClient.get<MesProRouteProductApi.RouteProduct[]>(
    `/mes/pro/route-product/list-by-route?routeId=${routeId}`,
  );
}

/** 查询工艺路线产品详情 */
export function getRouteProduct(id: number) {
  return requestClient.get<MesProRouteProductApi.RouteProduct>(
    `/mes/pro/route-product/get?id=${id}`,
  );
}

/** 新增工艺路线产品 */
export function createRouteProduct(data: MesProRouteProductApi.RouteProduct) {
  return requestClient.post<number>('/mes/pro/route-product/create', data);
}

/** 修改工艺路线产品 */
export function updateRouteProduct(data: MesProRouteProductApi.RouteProduct) {
  return requestClient.put('/mes/pro/route-product/update', data);
}

/** 删除工艺路线产品 */
export function deleteRouteProduct(id: number) {
  return requestClient.delete(`/mes/pro/route-product/delete?id=${id}`);
}
