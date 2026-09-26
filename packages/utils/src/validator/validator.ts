import { MOBILE_REGEX } from './regex';

/**
 * 验证是否为手机号码（中国）
 *
 * @param value 值
 * @returns 是否为手机号码（中国）
 */
function isMobile(value?: null | string): boolean {
  if (!value) {
    return false;
  }
  return MOBILE_REGEX.test(value);
}

export { isMobile };

/** 校验服务器主机名或 IP，不包含协议、路径和端口 */
export function isServerHost(value?: null | string): boolean {
  if (!value || value.length > 253) return false;
  const ipv4 =
    /^(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  if (value.includes(':')) {
    let address = value;
    if (address.includes('.')) {
      const index = address.lastIndexOf(':');
      if (!ipv4.test(address.slice(index + 1))) return false;
      address = `${address.slice(0, index + 1)}0:0`;
    }
    const parts = address.split('::');
    if (
      parts.length > 2 ||
      !parts.every(
        (part) => part === '' || /^[\da-f]{1,4}(?::[\da-f]{1,4})*$/i.test(part),
      )
    )
      return false;
    const count = parts.reduce(
      (total, part) => total + (part ? part.split(':').length : 0),
      0,
    );
    return parts.length === 2 ? count < 8 : count === 8;
  }
  if (/^\d+(?:\.\d+){3}$/.test(value)) return ipv4.test(value);
  return /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)*\.?$/i.test(
    value,
  );
}
