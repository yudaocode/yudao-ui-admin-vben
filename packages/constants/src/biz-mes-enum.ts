/** MES 单据状态常量 */
export const MesOrderStatusConstants = {
  DRAFT: 0,
  CONFIRMED: 1,
  APPROVING: 2,
  APPROVED: 3,
  FINISHED: 4,
  CANCELLED: 5,
} as const;

/** MES 物料/产品标识枚举 */
export const MesItemOrProductEnum = {
  ITEM: {
    label: '物料',
    value: 'ITEM',
  },
  PRODUCT: {
    label: '产品',
    value: 'PRODUCT',
  },
} as const;

/** MES 工具状态枚举 */
export const MesToolStatusEnum = {
  STORE: 1,
  ISSUE: 2,
  REPAIR: 3,
  SCRAP: 4,
} as const;

/** MES 保养维护类型枚举 */
export const MesMaintenTypeEnum = {
  REGULAR: 1,
  USAGE: 2,
} as const;

/** MES 设备状态枚举 */
export const MesDvMachineryStatusEnum = {
  STOP: 1,
  PRODUCING: 2,
  MAINTENANCE: 3,
} as const;

/** MES 假期类型枚举 */
export const HolidayType = {
  WORKDAY: 1,
  HOLIDAY: 2,
} as const;

/** MES 排班计划状态枚举 */
export const MesCalPlanStatusEnum = {
  PREPARE: 0,
  CONFIRMED: 1,
} as const;

/** MES 轮班方式枚举 */
export const MesCalShiftTypeEnum = {
  SINGLE: 1,
  TWO: 2,
  THREE: 3,
} as const;

/** MES 倒班方式枚举 */
export const MesCalShiftMethodEnum = {
  QUARTER: 1,
  MONTH: 2,
  WEEK: 3,
  DAY: 4,
} as const;

/** MES 点检保养项目类型枚举 */
export const MesDvSubjectTypeEnum = {
  CHECK: 1,
  MAINTENANCE: 2,
} as const;

/** MES 点检保养方案状态枚举 */
export const MesDvCheckPlanStatusEnum = {
  PREPARE: 0,
  ENABLED: 1,
} as const;

/** MES 设备保养记录状态枚举 */
export const MesDvMaintenRecordStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  SUBMITTED: MesOrderStatusConstants.FINISHED,
} as const;

/** MES 设备保养明细结果枚举 */
export const MesDvMaintenStatusEnum = {
  NORMAL: 1,
  ABNORMAL: 2,
} as const;

/** MES 设备点检记录状态枚举 */
export const MesDvCheckRecordStatusEnum = {
  DRAFT: 10,
  FINISHED: 20,
} as const;

/** MES 设备点检结果枚举 */
export const MesDvCheckResultEnum = {
  NORMAL: 1,
  ABNORMAL: 2,
} as const;

/** MES 维修工单状态枚举 */
export const MesDvRepairStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  FINISHED: MesOrderStatusConstants.FINISHED,
} as const;

/** MES 维修结果枚举 */
export const MesDvRepairResultEnum = {
  PASS: 1,
  FAIL: 2,
} as const;

/** MES 自动编码规则 Code 枚举 */
export const MesAutoCodeRuleCode = {
  CAL_PLAN_CODE: 'CAL_PLAN_CODE',
  CAL_TEAM_CODE: 'CAL_TEAM_CODE',
  DV_CHECK_PLAN_CODE: 'DV_CHECK_PLAN_CODE',
  DV_MACHINERY_TYPE_CODE: 'DV_MACHINERY_TYPE_CODE',
  DV_MACHINERY_CODE: 'DV_MACHINERY_CODE',
  DV_REPAIR_CODE: 'DV_REPAIR_CODE',
  DV_SUBJECT_CODE: 'DV_SUBJECT_CODE',
  MD_CLIENT_CODE: 'MD_CLIENT_CODE',
  MD_ITEM_TYPE_CODE: 'MD_ITEM_TYPE_CODE',
  MD_ITEM_CODE: 'MD_ITEM_CODE',
  MD_VENDOR_CODE: 'MD_VENDOR_CODE',
  MD_WORKSTATION_CODE: 'MD_WORKSTATION_CODE',
  MD_WORKSHOP_CODE: 'MD_WORKSHOP_CODE',
  PRO_CARD_CODE: 'PRO_CARD_CODE',
  PRO_FEEDBACK_CODE: 'PRO_FEEDBACK_CODE',
  PRO_PROCESS_CODE: 'PRO_PROCESS_CODE',
  PRO_ROUTE_CODE: 'PRO_ROUTE_CODE',
  PRO_TASK_CODE: 'PRO_TASK_CODE',
  PRO_WORK_ORDER_CODE: 'PRO_WORK_ORDER_CODE',
  QC_DEFECT_CODE: 'QC_DEFECT_CODE',
  QC_INDICATOR_CODE: 'QC_INDICATOR_CODE',
  QC_INDICATOR_RESULT_CODE: 'QC_INDICATOR_RESULT_CODE',
  QC_IQC_CODE: 'QC_IQC_CODE',
  QC_IPQC_CODE: 'QC_IPQC_CODE',
  QC_OQC_CODE: 'QC_OQC_CODE',
  QC_RQC_CODE: 'QC_RQC_CODE',
  QC_TEMPLATE_CODE: 'QC_TEMPLATE_CODE',
  TM_TOOL_TYPE_CODE: 'TM_TOOL_TYPE_CODE',
  TM_TOOL_CODE: 'TM_TOOL_CODE',
  WM_AREA_CODE: 'WM_AREA_CODE',
  WM_LOCATION_CODE: 'WM_LOCATION_CODE',
  WM_ARRIVAL_NOTICE_CODE: 'WM_ARRIVAL_NOTICE_CODE',
  WM_ITEM_RECEIPT_CODE: 'WM_ITEM_RECEIPT_CODE',
  WM_RETURN_VENDOR_CODE: 'WM_RETURN_VENDOR_CODE',
  WM_SALES_NOTICE_CODE: 'WM_SALES_NOTICE_CODE',
  WM_RETURN_SALES_CODE: 'WM_RETURN_SALES_CODE',
  WM_RETURN_ISSUE_CODE: 'WM_RETURN_ISSUE_CODE',
  WM_PRODUCT_ISSUE_CODE: 'WM_PRODUCT_ISSUE_CODE',
  WM_PRODUCT_SALES_CODE: 'WM_PRODUCT_SALES_CODE',
  PRODUCTRECPT_CODE: 'PRODUCTRECPT_CODE',
  WM_MISC_ISSUE_CODE: 'WM_MISC_ISSUE_CODE',
  WM_MISC_RECEIPT_CODE: 'WM_MISC_RECEIPT_CODE',
  WM_OUTSOURCE_ISSUE_CODE: 'WM_OUTSOURCE_ISSUE_CODE',
  WM_OUTSOURCE_RECEIPT_CODE: 'WM_OUTSOURCE_RECEIPT_CODE',
  WM_PACKAGE_CODE: 'WM_PACKAGE_CODE',
  WM_SN_CODE: 'WM_SN_CODE',
  WM_BATCH_CODE: 'WM_BATCH_CODE',
  WM_STOCK_TAKING_CODE: 'WM_STOCK_TAKING_CODE',
  WM_STOCK_TAKING_PLAN_CODE: 'WM_STOCK_TAKING_PLAN_CODE',
  WM_WAREHOUSE_CODE: 'WM_WAREHOUSE_CODE',
  TRANSFER_CODE: 'TRANSFER_CODE',
} as const;

/** MES 装箱单状态枚举 */
export const MesWmPackageStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  FINISHED: MesOrderStatusConstants.FINISHED,
} as const;

/** MES 盘点类型枚举 */
export const MesWmStockTakingTypeEnum = {
  STATIC: 1,
  DYNAMIC: 2,
} as const;

/** MES 盘点任务状态枚举 */
export const MesWmStockTakingTaskStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 盘点任务行状态枚举 */
export const MesWmStockTakingTaskLineStatusEnum = {
  UNCOUNTED: 0,
  NORMAL: 1,
  GAIN: 2,
  LOSS: 3,
} as const;

/** MES 盘点方案参数类型枚举 */
export const MesWmStockTakingParamTypeEnum = {
  WAREHOUSE: 102,
  LOCATION: 103,
  AREA: 104,
  BATCH: 107,
  ITEM: 600,
  QUALITY_STATUS: 900,
} as const;

/** MES 生产工单状态枚举（独立于通用单据状态，对齐后端 MesProWorkOrderStatusEnum） */
export const MesProWorkOrderStatusEnum = {
  PREPARE: 0, // 草稿
  CONFIRMED: 1, // 已确认
  FINISHED: 2, // 已完成
  CANCELED: 3, // 已取消
} as const;

/** MES 工单类型枚举 */
export const MesProWorkOrderTypeEnum = {
  SELF: 1, // 自行生产
  OUTSOURCE: 2, // 代工
  PURCHASE: 3, // 采购
} as const;

/** MES 工单来源类型枚举 */
export const MesProWorkOrderSourceTypeEnum = {
  ORDER: 1, // 客户订单
  STORE: 2, // 库存备货
} as const;

/** MES 生产任务状态枚举 */
export const MesProTaskStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  PRODUCING: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELLED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 生产报工状态枚举 */
export const MesProFeedbackStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  UNCHECK: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 流转卡状态枚举（复用工单状态值，对齐后端 MesProWorkOrderStatusEnum） */
export const MesProCardStatusEnum = {
  PREPARE: 0, // 草稿
  CONFIRMED: 1, // 已确认
  FINISHED: 2, // 已完成
  CANCELED: 3, // 已取消
} as const;

/** MES 安灯处置状态枚举 */
export const MesProAndonStatusEnum = {
  ACTIVE: 0, // 未处置
  HANDLED: 1, // 已处置
} as const;

/** MES 安灯级别枚举 */
export const MesProAndonLevelEnum = {
  LEVEL1: 1,
  LEVEL2: 2,
  LEVEL3: 3,
} as const;

/** MES 上下工状态类型枚举 */
export const MesProWorkRecordTypeEnum = {
  CLOCK_IN: 1,
  CLOCK_OUT: 2,
} as const;

/** MES 生产报工类型枚举 */
export const MesProFeedbackTypeEnum = {
  SELF: 1, // 自行报工
  UNIFIED: 2, // 统一报工
} as const;

/** MES 杂项出库单状态枚举 */
export const MesWmMiscIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 杂项入库单状态枚举 */
export const MesWmMiscReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 外协发料单状态枚举 */
export const MesWmOutsourceIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELLED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 外协入库单状态枚举 */
export const MesWmOutsourceReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 转移单类型枚举 */
export const MesWmTransferTypeEnum = {
  INNER: 1, // 内部调拨
  OUTER: 2, // 外部调拨
} as const;

/** MES 转移单状态枚举 */
export const MesWmTransferStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT, // 草稿
  UNCONFIRMED: MesOrderStatusConstants.CONFIRMED, // 待确认
  APPROVING: MesOrderStatusConstants.APPROVING, // 待上架
  APPROVED: MesOrderStatusConstants.APPROVED, // 待执行
  FINISHED: MesOrderStatusConstants.FINISHED, // 已完成
  CANCELED: MesOrderStatusConstants.CANCELLED, // 已取消
} as const;

/** MES 到货通知单状态枚举 */
export const MesWmArrivalNoticeStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  PENDING_QC: MesOrderStatusConstants.APPROVING,
  PENDING_RECEIPT: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
} as const;

/** MES 采购入库单状态枚举 */
export const MesWmItemReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 供应商退货单状态枚举 */
export const MesWmReturnVendorStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 发货通知单状态枚举 */
export const MesWmSalesNoticeStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVED: MesOrderStatusConstants.APPROVED,
} as const;

/** MES 销售退货单状态枚举 */
export const MesWmReturnSalesStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 生产退料单状态枚举 */
export const MesWmReturnIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 领料出库单状态枚举 */
export const MesWmProductIssueStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 产品入库单状态枚举 */
export const MesWmProductReceiptStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  APPROVING: MesOrderStatusConstants.APPROVING,
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 生产入库单状态枚举 */
export const MesWmProductProduceStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 销售出库单状态枚举 */
export const MesWmProductSalesStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  SHIPPING: 10, // 待填写运单
  APPROVED: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 仓库常量 */
export const MesWmWarehouseConstants = {
  /** 虚拟线边仓编码关键字（对应后端 MesWmWarehouseDO.WIP_VIRTUAL_WAREHOUSE） */
  WIP_VIRTUAL: 'WIP_VIRTUAL',
} as const;

/** MES 质检结果值类型枚举 */
export const MesQcResultValueType = {
  FLOAT: 1,
  INTEGER: 2,
  TEXT: 3,
  DICT: 4,
  FILE: 5,
} as const;

/** MES 业务类型常量 */
export const MesBizTypeEnum = {
  // WM 仓库模块 [100, 200)
  WM_ARRIVAL_NOTICE: 100, // 到货通知单
  WM_RETURN_ISSUE: 116, // 生产退料
  WM_PRODUCT_SALES: 118, // 销售出库
  WM_RETURN_SALES: 119, // 销售退货入库
  WM_OUTSOURCE_RECPT: 121, // 外协入库

  // PRO 生产模块 [300, 400)
  PRO_FEEDBACK: 304, // 生产报工
} as const;

/** MES 质检来源单据类型枚举 */
export const MesQcSourceDocTypeEnum = {
  // IQC
  ARRIVAL_NOTICE: MesBizTypeEnum.WM_ARRIVAL_NOTICE,
  OUTSOURCE_RECPT: MesBizTypeEnum.WM_OUTSOURCE_RECPT,
  // IPQC
  PRO_FEEDBACK: MesBizTypeEnum.PRO_FEEDBACK,
  // OQC
  PRODUCT_SALES: MesBizTypeEnum.WM_PRODUCT_SALES,
  // RQC
  RETURN_ISSUE: MesBizTypeEnum.WM_RETURN_ISSUE,
  RETURN_SALES: MesBizTypeEnum.WM_RETURN_SALES,
} as const;

/** MES 质检类型枚举 */
export const MesQcTypeEnum = {
  IQC: 1, // 来料检验
  IPQC: 2, // 过程检验
  OQC: 3, // 出货检验
  RQC: 4, // 退货检验
} as const;

/** MES 质检单状态枚举 */
export const MesQcStatusEnum = {
  DRAFT: MesOrderStatusConstants.DRAFT,
  FINISHED: MesOrderStatusConstants.FINISHED,
} as const;

/** MES 编码规则分段类型枚举 */
export const MesAutoCodePartTypeEnum = {
  INPUT: 1,
  DATE: 2,
  FIX: 3,
  SERIAL: 4,
} as const;

/** MES 编码规则补齐方式枚举 */
export const MesAutoCodePaddedMethodEnum = {
  LEFT: 1, // 左补齐
  RIGHT: 2, // 右补齐
} as const;

/** MES 条码格式枚举 */
export enum BarcodeFormatEnum {
  QR_CODE = 1,
  EAN13 = 2,
  CODE39 = 3,
  UPC_A = 4,
}

/** 条码格式映射表（枚举值 -> JsBarcode 格式名） */
export const BARCODE_FORMAT_MAP: Record<BarcodeFormatEnum, string> = {
  [BarcodeFormatEnum.QR_CODE]: 'QR_CODE',
  [BarcodeFormatEnum.EAN13]: 'EAN13',
  [BarcodeFormatEnum.CODE39]: 'CODE39',
  [BarcodeFormatEnum.UPC_A]: 'UPC_A',
};

/** MES 条码业务类型枚举 */
export enum BarcodeBizTypeEnum {
  WAREHOUSE = 102,
  LOCATION = 103,
  AREA = 104,
  PACKAGE = 105,
  STOCK = 106,
  BATCH = 107,
  PROCARD = 300,
  WORKORDER = 301,
  TRANSORDER = 302,
  TASK = 303,
  MACHINERY = 400,
  TOOL = 500,
  ITEM = 600,
  VENDOR = 601,
  WORKSTATION = 602,
  WORKSHOP = 603,
  USER = 604,
  CLIENT = 605,
}
