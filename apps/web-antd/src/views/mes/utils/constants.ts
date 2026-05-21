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

/** MES 自动编码规则 Code 枚举 */
export const MesAutoCodeRuleCode = {
  MD_CLIENT_CODE: 'MD_CLIENT_CODE',
  MD_ITEM_TYPE_CODE: 'MD_ITEM_TYPE_CODE',
  MD_ITEM_CODE: 'MD_ITEM_CODE',
  MD_VENDOR_CODE: 'MD_VENDOR_CODE',
  MD_WORKSHOP_CODE: 'MD_WORKSHOP_CODE',
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
