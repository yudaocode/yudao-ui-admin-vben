/**
 * 将一个整数转换为分数保留两位小数
 * @param num
 */
export const formatToFraction = (num: number | string | undefined): string => {
  if (typeof num === 'undefined') return '0.00';
  const parsedNumber = typeof num === 'string' ? parseFloat(num) : num;
  return (parsedNumber / 100.0).toFixed(2);
};

/**
 * 将一个数转换为 1.00 这样
 * 数据呈现的时候使用
 *
 * @param num 整数
 */
// TODO @芋艿：看看怎么融合掉
export const floatToFixed2 = (num: number | string | undefined): string => {
  let str = '0.00';
  if (typeof num === 'undefined') {
    return str;
  }
  const f = formatToFraction(num);
  const decimalPart = f.toString().split('.')[1];
  const len = decimalPart ? decimalPart.length : 0;
  switch (len) {
    case 0:
      str = f.toString() + '.00';
      break;
    case 1:
      str = f.toString() + '0';
      break;
    case 2:
      str = f.toString();
      break;
  }
  return str;
};
