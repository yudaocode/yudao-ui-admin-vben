/** 格式化 Token 数：null 表示未取得，真实 0 显示 0 */
export function formatTokenCount(value?: null | number) {
  return value === null || value === undefined
    ? '未取得'
    : value.toLocaleString();
}
