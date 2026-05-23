export namespace WmsMovementOrderDetailApi {
  /** WMS 移库单明细 */
  export interface MovementOrderDetail {
    id?: number;
    orderId?: number;
    itemId?: number;
    itemCode?: string;
    itemName?: string;
    unit?: string;
    skuId?: number;
    skuCode?: string;
    skuName?: string;
    sourceWarehouseId?: number;
    sourceWarehouseName?: string;
    targetWarehouseId?: number;
    targetWarehouseName?: string;
    quantity?: number;
    availableQuantity?: number;
    price?: number;
    totalPrice?: number;
    createTime?: Date;
  }
}
