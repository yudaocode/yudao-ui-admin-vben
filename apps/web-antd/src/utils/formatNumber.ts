/**
 * 将一个整数转换为分数保留两位小数
 * @param num
 */
export function formatToFraction(num: number | string | undefined): string {
  if (num === undefined) return '0.00';
  const parsedNumber = typeof num === 'string' ? Number.parseFloat(num) : num;
  return (parsedNumber / 100).toFixed(2);
}

/**
 * 将一个数转换为 1.00 这样
 * 数据呈现的时候使用
 *
 * @param num 整数
 */
export function floatToFixed2(num: number | string | undefined): string {
  let str = '0.00';
  if (num === undefined) {
    return str;
  }
  const f = formatToFraction(num);
  const decimalPart = f.toString().split('.')[1];
  const len = decimalPart ? decimalPart.length : 0;
  switch (len) {
    case 0: {
      str = `${f.toString()}.00`;
      break;
    }
    case 1: {
      str = `${f.toString()}0`;
      break;
    }
    case 2: {
      str = f.toString();
      break;
    }
  }
  return str;
}

/**
 * 将一个分数转换为整数
 * @param num
 */
export function convertToInteger(num: number | string | undefined): number {
  if (num === undefined) return 0;
  const parsedNumber = typeof num === 'string' ? Number.parseFloat(num) : num;
  return Math.round(parsedNumber * 100);
}

/**
 * 元转分
 */
export function yuanToFen(amount: number | string): number {
  return convertToInteger(amount);
}

/**
 * 分转元
 */
export function fenToYuan(price: number | string): string {
  return formatToFraction(price);
}

/**
 * 计算环比
 *
 * @param value 当前数值
 * @param reference 对比数值
 */
export function calculateRelativeRate(
  value?: number,
  reference?: number,
): number {
  // 防止除0
  if (!reference || reference === 0) return 0;

  return Number.parseFloat(
    ((100 * ((value || 0) - reference)) / reference).toFixed(0),
  );
}
