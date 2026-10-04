import { requestClient } from '#/api/request';

export namespace XqStoreWarehouseApi {
  export interface Warehouse {
    id: number;
    code: string;
    name: string;
    countryCode?: string;
    countryName?: string;
    sort?: number;
    enabled?: boolean;
    remark?: string;
  }

  export interface WarehouseSaveReq {
    id?: number;
    code: string;
    name: string;
    countryCode?: string;
    countryName?: string;
    sort?: number;
    enabled?: boolean;
    remark?: string;
  }

  export interface StoreWarehouse {
    id: number;
    storeId: number;
    storeName?: string;
    platformCode?: string;
    platformName?: string;
    warehouseId?: number;
    warehouseCode?: string;
    warehouseName?: string;
    physicalCode?: string;
    physicalName?: string;
    countryCode?: string;
    priority?: number;
    shippingMethod?: string;
    courierAccount?: string;
    enabled?: boolean;
    remark?: string;
  }

  export interface StoreWarehouseSaveReq {
    id?: number;
    storeId: number;
    warehouseId?: number;
    physicalCode?: string;
    physicalName?: string;
    countryCode?: string;
    priority?: number;
    shippingMethod?: string;
    courierAccount?: string;
    enabled?: boolean;
    remark?: string;
  }
}

export function getXqWarehouses() {
  return requestClient.get<XqStoreWarehouseApi.Warehouse[]>(
    '/xq/store-platform/warehouse/list',
  );
}

export function saveXqWarehouse(data: XqStoreWarehouseApi.WarehouseSaveReq) {
  return requestClient.post<number>('/xq/store-platform/warehouse/save', data);
}

export function deleteXqWarehouse(id: number) {
  return requestClient.delete<boolean>('/xq/store-platform/warehouse/delete', {
    params: { id },
  });
}

export function getXqStoreWarehouses(storeId?: number) {
  return requestClient.get<XqStoreWarehouseApi.StoreWarehouse[]>(
    '/xq/store-platform/store-warehouse/list',
    { params: storeId ? { storeId } : {} },
  );
}

export function saveXqStoreWarehouse(
  data: XqStoreWarehouseApi.StoreWarehouseSaveReq,
) {
  return requestClient.post<number>(
    '/xq/store-platform/store-warehouse/save',
    data,
  );
}

export function deleteXqStoreWarehouse(id: number) {
  return requestClient.delete<boolean>(
    '/xq/store-platform/store-warehouse/delete',
    { params: { id } },
  );
}
