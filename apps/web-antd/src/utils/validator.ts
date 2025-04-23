// 参数校验，对标 Hutool 的 Validator 工具类

/** 手机号正则表达式（中国） */
const MOBILE_REGEX = /(?:0|86|\+86)?1[3-9]\d{9}/;

/**
 * 验证是否为手机号码（中国）
 *
 * @param value 值
 * @returns 是否为手机号码（中国）
 */
export function isMobile(value?: null | string): boolean {
  if (!value) {
    return false;
  }
  return MOBILE_REGEX.test(value);
}
