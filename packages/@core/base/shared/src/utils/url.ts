/**
 * URL 验证
 * @param path URL 路径
 */
export function isUrl(path: string): boolean {
  try {
    return Boolean(new URL(path));
  } catch {
    return false;
  }
}
