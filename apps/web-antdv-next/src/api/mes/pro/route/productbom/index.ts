import { requestClient } from '#/api/request';

export namespace MesProRouteProductBomApi {
  /** MES 工艺路线产品 BOM */
  export interface RouteProductBom {
    id?: number;
    routeId?: number;
    processId?: number;
    productId?: number;
    itemId?: number;
    itemCode?: string;
    itemName?: string;
    specification?: string;
    unitName?: string;
    quantity?: number;
    remark?: string;
    createTime?: Date;
  }
}

/** 查询工艺路线产品 BOM 列表 */
export function getRouteProductBomList(params: {
  processId?: number;
  productId?: number;
  routeId: number;
}) {
  return requestClient.get<MesProRouteProductBomApi.RouteProductBom[]>(
    '/mes/pro/route-product-bom/list',
    { params },
  );
}

/** 查询工艺路线产品 BOM 详情 */
export function getRouteProductBom(id: number) {
  return requestClient.get<MesProRouteProductBomApi.RouteProductBom>(
    `/mes/pro/route-product-bom/get?id=${id}`,
  );
}

/** 新增工艺路线产品 BOM */
export function createRouteProductBom(
  data: MesProRouteProductBomApi.RouteProductBom,
) {
  return requestClient.post('/mes/pro/route-product-bom/create', data);
}

/** 修改工艺路线产品 BOM */
export function updateRouteProductBom(
  data: MesProRouteProductBomApi.RouteProductBom,
) {
  return requestClient.put('/mes/pro/route-product-bom/update', data);
}

/** 删除工艺路线产品 BOM */
export function deleteRouteProductBom(id: number) {
  return requestClient.delete(`/mes/pro/route-product-bom/delete?id=${id}`);
}
