/** 条码格式枚举 */
export const BarcodeFormatEnum = {
  QR_CODE: 1,
  EAN13: 2,
  CODE39: 3,
  UPC_A: 4,
} as const;

export type BarcodeFormat =
  (typeof BarcodeFormatEnum)[keyof typeof BarcodeFormatEnum];

/** 条码格式映射表（枚举值 -> JsBarcode 格式名） */
export const BARCODE_FORMAT_MAP: Record<BarcodeFormat, string> = {
  [BarcodeFormatEnum.QR_CODE]: 'QR_CODE',
  [BarcodeFormatEnum.EAN13]: 'EAN13',
  [BarcodeFormatEnum.CODE39]: 'CODE39',
  [BarcodeFormatEnum.UPC_A]: 'UPC_A',
};
