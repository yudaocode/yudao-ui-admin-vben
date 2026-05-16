/**
 * 生成 WMS 编号 / 条码。
 *
 * @param prefix 可选前缀，按业务域区分编号种类。
 * @returns 前缀 + 8 位随机数字串。
 */
export function generateWmsCode(prefix = ''): string {
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return prefix + result;
}
