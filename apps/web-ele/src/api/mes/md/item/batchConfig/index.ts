import { requestClient } from '#/api/request';

export namespace MesMdItemBatchConfigApi {
  /** MES 物料批次属性配置 */
  export interface BatchConfig {
    id?: number;
    itemId?: number;
    produceDateFlag?: boolean;
    expireDateFlag?: boolean;
    receiptDateFlag?: boolean;
    vendorFlag?: boolean;
    clientFlag?: boolean;
    salesOrderCodeFlag?: boolean;
    purchaseOrderCodeFlag?: boolean;
    workorderFlag?: boolean;
    taskFlag?: boolean;
    workstationFlag?: boolean;
    toolFlag?: boolean;
    moldFlag?: boolean;
    lotNumberFlag?: boolean;
    qualityStatusFlag?: boolean;
  }
}

/** 根据物料编号获取批次属性配置 */
export function getBatchConfigByItemId(itemId: number) {
  return requestClient.get<MesMdItemBatchConfigApi.BatchConfig>(
    `/mes/md/item-batch-config/get-by-item-id?itemId=${itemId}`,
  );
}

/** 保存批次属性配置 */
export function saveBatchConfig(
  data: MesMdItemBatchConfigApi.BatchConfig,
) {
  return requestClient.post('/mes/md/item-batch-config/save', data);
}
