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
  TM_TOOL_TYPE_CODE: 'TM_TOOL_TYPE_CODE',
  TM_TOOL_CODE: 'TM_TOOL_CODE',
} as const;

/** MES 生产工单状态枚举 */
export const MesProWorkOrderStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  PRODUCING: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELLED: MesOrderStatusConstants.CANCELLED,
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
  CONFIRMED: MesOrderStatusConstants.CONFIRMED,
  APPROVING: MesOrderStatusConstants.APPROVING,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELLED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 流转卡状态枚举 */
export const MesProCardStatusEnum = {
  PREPARE: MesOrderStatusConstants.DRAFT,
  ISSUED: MesOrderStatusConstants.CONFIRMED,
  PRODUCING: MesOrderStatusConstants.APPROVED,
  FINISHED: MesOrderStatusConstants.FINISHED,
  CANCELLED: MesOrderStatusConstants.CANCELLED,
} as const;

/** MES 安灯类型枚举 */
export const MesProAndonTypeEnum = {
  QUALITY: 1,
  EQUIPMENT: 2,
  MATERIAL: 3,
  PROCESS: 4,
  OTHER: 9,
} as const;

/** MES 安灯状态枚举 */
export const MesProAndonStatusEnum = {
  TRIGGERED: 1,
  HANDLING: 2,
  CLOSED: 3,
} as const;

/** MES 编码规则分段类型枚举 */
export const MesAutoCodePartTypeEnum = {
  INPUT: 1,
  DATE: 2,
  FIX: 3,
  SERIAL: 4,
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
