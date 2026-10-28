import { ProtocolTypeEnum } from '#/api/iot/product/product';

/** 透传消息方法 */
export const IotRawMessageMethodEnum = {
  RAW_POST: {
    method: 'thing.raw.post',
    name: '透传上报',
    upstream: true,
  },
  RAW_PUSH: {
    method: 'thing.raw.push',
    name: '透传下发',
    upstream: false,
  },
} as const;

/** 透传载荷最大字节数 */
export const RAW_PAYLOAD_MAX_BYTES = 4096;
/** Modbus PDU 最小、最大字节数 */
export const MODBUS_PDU_MIN_BYTES = 5;
export const MODBUS_PDU_MAX_BYTES = 253;
/** Modbus 写操作功能码：05 写单个线圈、06 写单个寄存器、0F 写多个线圈、10 写多个寄存器 */
export const MODBUS_WRITE_FUNCTION_CODES = new Set([0x05, 0x06, 0x0f, 0x10]);

/** 判断是否为 Modbus 协议 */
export function isModbusProtocol(protocolType?: string) {
  return (
    protocolType === ProtocolTypeEnum.MODBUS_TCP_CLIENT ||
    protocolType === ProtocolTypeEnum.MODBUS_TCP_SERVER
  );
}

/** 判断协议是否支持透传下发（HTTP、CoAP 不支持） */
export function isRawPushSupported(protocolType?: string) {
  return (
    protocolType !== ProtocolTypeEnum.HTTP &&
    protocolType !== ProtocolTypeEnum.COAP
  );
}

/**
 * 解析 HEX 字符串为字节数组，允许空格等空白分隔
 *
 * @param hex HEX 字符串
 * @returns 字节数组；格式不合法时返回 undefined
 */
export function hexToBytes(hex: string): Uint8Array | undefined {
  const text = (hex || '').replaceAll(/\s+/g, '');
  if (text.length === 0 || text.length % 2 !== 0) {
    return undefined;
  }
  if (!/^[\da-f]+$/i.test(text)) {
    return undefined;
  }
  const bytes = new Uint8Array(text.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(text.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** 字节数组转为大写、空格分隔的 HEX 字符串 */
export function bytesToHex(bytes: ArrayLike<number>) {
  const parts: string[] = [];
  for (let i = 0; i < bytes.length; i++) {
    parts.push((bytes[i]! & 0xff).toString(16).toUpperCase().padStart(2, '0'));
  }
  return parts.join(' ');
}

/** 字节数组转为 Base64 */
export function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

/**
 * Base64 转为 HEX 字符串（大写、空格分隔）
 *
 * @param base64 Base64 字符串
 * @returns HEX 字符串；无法解析时返回 undefined
 */
export function base64ToHex(base64?: string): string | undefined {
  if (typeof base64 !== 'string' || base64.length === 0) {
    return undefined;
  }
  try {
    const binary = atob(base64);
    const bytes: number[] = [];
    for (let i = 0; i < binary.length; i++) {
      bytes.push(binary.codePointAt(i)!);
    }
    return bytesToHex(bytes);
  } catch {
    return undefined;
  }
}

/**
 * 计算文本 UTF-8 编码后的 SHA-256 短码（前 12 位小写 HEX）
 *
 * crypto.subtle 只在安全上下文（HTTPS、localhost）中可用，不可用时返回 undefined
 */
export async function sha256ShortHash(content?: null | string) {
  if (!content) {
    return undefined;
  }
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    return undefined;
  }
  try {
    const digest = await subtle.digest(
      'SHA-256',
      new TextEncoder().encode(content),
    );
    return [...new Uint8Array(digest)]
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 12);
  } catch {
    return undefined;
  }
}

/** 计算文本 UTF-8 编码后的字节数 */
export function getUtf8ByteLength(content?: null | string) {
  return content ? new TextEncoder().encode(content).length : 0;
}
