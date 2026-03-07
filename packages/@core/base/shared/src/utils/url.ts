/**
 * URL 验证
 * @param path URL 路径
 */
export function isUrl(path: string): boolean {
  try {
    new URL(path);
    return true;
  } catch {
    return false;
  }
}
