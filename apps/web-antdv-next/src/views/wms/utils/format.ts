/**
 * WMS 展示格式化和表单配置
 */

type DecimalValue = null | number | string | undefined;

/** 数量小数位 */
export const QUANTITY_PRECISION = 2;
/** 金额小数位 */
export const PRICE_PRECISION = 2;
/** 重量小数位 */
export const WEIGHT_PRECISION = 3;
/** 长宽高小数位 */
export const DIMENSION_PRECISION = 1;

function isNullOrUndefined(value: unknown) {
  return value === null || value === undefined;
}

function toFiniteDecimal(value: DecimalValue) {
  if (isNullOrUndefined(value)) {
    return undefined;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  const decimalValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(decimalValue)) {
    return undefined;
  }
  return decimalValue;
}

function sumDecimal<T>(list: T[], getter: (item: T) => DecimalValue) {
  let sum = 0;
  for (const item of list) {
    const decimalValue = toFiniteDecimal(getter(item));
    if (decimalValue !== undefined) {
      sum += decimalValue;
    }
  }
  return sum;
}

/** 格式化数量 */
export function formatQuantity(value?: null | number | string) {
  const decimalValue = toFiniteDecimal(value);
  return decimalValue === undefined
    ? ''
    : decimalValue.toFixed(QUANTITY_PRECISION);
}

/** 格式化金额 */
export function formatPrice(value?: null | number | string) {
  const decimalValue = toFiniteDecimal(value);
  return decimalValue === undefined
    ? ''
    : decimalValue.toFixed(PRICE_PRECISION);
}

/** 金额四舍五入 */
export function roundPrice(value: number) {
  return Number.isFinite(value)
    ? Number(value.toFixed(PRICE_PRECISION))
    : undefined;
}

/** 亏损数字样式 */
export function getLossClass(value?: null | number | string) {
  const decimalValue = toFiniteDecimal(value);
  return decimalValue !== undefined && decimalValue < 0 ? 'text-red-500' : '';
}

/** 数量 * 单价，计算金额 */
export function multiplyPrice(quantity?: number, price?: number) {
  if (
    quantity === undefined ||
    quantity === null ||
    price === undefined ||
    price === null
  ) {
    return undefined;
  }
  return roundPrice(Number(quantity) * Number(price));
}

/** 金额 / 数量，反算单价 */
export function dividePrice(totalPrice?: number, quantity?: number) {
  if (totalPrice === undefined || totalPrice === null || !quantity) {
    return undefined;
  }
  return roundPrice(Number(totalPrice) / Number(quantity));
}

/** 汇总数量 */
export function sumQuantity<T>(list: T[], getter: (item: T) => DecimalValue) {
  return sumDecimal(list, getter);
}

/** 汇总金额 */
export function sumPrice<T>(list: T[], getter: (item: T) => DecimalValue) {
  return sumDecimal(list, getter);
}

/** 格式化汇总数量 */
export function formatSumQuantity<T>(
  list: T[],
  getter: (item: T) => DecimalValue,
) {
  return formatQuantity(sumQuantity(list, getter));
}

/** 格式化汇总金额 */
export function formatSumPrice<T>(
  list: T[],
  getter: (item: T) => DecimalValue,
) {
  return formatPrice(sumPrice(list, getter));
}

/** 格式化重量 */
export function formatWeight(value?: null | number | string) {
  const decimalValue = toFiniteDecimal(value);
  return decimalValue === undefined
    ? ''
    : decimalValue.toFixed(WEIGHT_PRECISION);
}

/** 格式化长宽高 */
export function formatDimension(value?: null | number | string) {
  const decimalValue = toFiniteDecimal(value);
  return decimalValue === undefined
    ? ''
    : decimalValue.toFixed(DIMENSION_PRECISION);
}

/** 格式化长宽高组合 */
export function formatDimensionText(
  length?: null | number | string,
  width?: null | number | string,
  height?: null | number | string,
) {
  if (
    !isNullOrUndefined(length) &&
    !isNullOrUndefined(width) &&
    !isNullOrUndefined(height)
  ) {
    return [
      formatDimension(length),
      formatDimension(width),
      formatDimension(height),
    ].join(' * ');
  }
  return [
    isNullOrUndefined(length) ? undefined : `长：${formatDimension(length)}`,
    isNullOrUndefined(width) ? undefined : `宽：${formatDimension(width)}`,
    isNullOrUndefined(height) ? undefined : `高：${formatDimension(height)}`,
  ]
    .filter(Boolean)
    .join(' ');
}
