import { requestClient } from '#/api/request';

export namespace MesMdItemBatchConfigApi {
  /** MES 物料批次属性配置 */
  export interface BatchConfig {
    id?: number; // 编号
    itemId?: number; // 物料编号
    produceDateFlag?: boolean; // 批次属性-生产日期
    expireDateFlag?: boolean; // 批次属性-有效期
    receiptDateFlag?: boolean; // 批次属性-入库日期
    vendorFlag?: boolean; // 批次属性-供应商
    clientFlag?: boolean; // 批次属性-客户
    salesOrderCodeFlag?: boolean; // 批次属性-销售订单编号
    purchaseOrderCodeFlag?: boolean; // 批次属性-采购订单编号
    workorderFlag?: boolean; // 批次属性-生产工单
    taskFlag?: boolean; // 批次属性-生产任务
    workstationFlag?: boolean; // 批次属性-工作站
    toolFlag?: boolean; // 批次属性-工具
    moldFlag?: boolean; // 批次属性-模具
    lotNumberFlag?: boolean; // 批次属性-生产批号
    qualityStatusFlag?: boolean; // 批次属性-质量状态
  }
}

/** 根据物料编号获取批次属性配置 */
export function getBatchConfigByItemId(itemId: number) {
  return requestClient.get<MesMdItemBatchConfigApi.BatchConfig>(
    `/mes/md/item-batch-config/get-by-item-id?itemId=${itemId}`,
  );
}

/** 保存批次属性配置 */
export function saveBatchConfig(data: MesMdItemBatchConfigApi.BatchConfig) {
  return requestClient.post('/mes/md/item-batch-config/save', data);
}
