import { openWindow } from './window';

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

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

/** URL 是否可安全打开 */
export function isOpenableUrl(url?: null | string): boolean {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url, window.location.origin);
    return SAFE_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/** 打开安全 URL */
export function openSafeUrl(url?: null | string): void {
  if (!url || !isOpenableUrl(url)) {
    return;
  }
  openWindow(url);
}
