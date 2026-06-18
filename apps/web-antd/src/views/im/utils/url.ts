// TODO @AI：全局有合适的 url 方法么？如果没有，封装到全局里。
const SAFE_PROTOCOLS = new Set(['http:', 'https:'])

/** URL 是否可安全打开 */
export function isOpenableUrl(url?: null | string) {
  if (!url) {
    return false
  }
  try {
    const parsed = new URL(url, window.location.origin)
    return SAFE_PROTOCOLS.has(parsed.protocol)
  } catch {
    return false
  }
}

/** 打开安全 URL */
export function openSafeUrl(url?: null | string) {
  if (!isOpenableUrl(url)) {
    return
  }
  if (!url) {
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}
