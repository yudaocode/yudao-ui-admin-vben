// ========== IOT - 设备模块 ==========
/**
 * 设备状态枚举
 */
export const DeviceStateEnum = {
  INACTIVE: 0, // 未激活
  OFFLINE: 2, // 离线
  ONLINE: 1, // 在线
} as const;

// ========== IOT - 产品模块 ==========
/**
 * 产品设备类型枚举
 */
export const DeviceTypeEnum = {
  DEVICE: 0, // 直连设备
  GATEWAY: 2, // 网关设备
  GATEWAY_SUB: 1, // 网关子设备
} as const;

/**
 * 产品状态枚举
 */
export const ProductStatusEnum = {
  UNPUBLISHED: 0, // 开发中
  PUBLISHED: 1, // 已发布
} as const;

/**
 * 产品定位类型枚举
 */
export const LocationTypeEnum = {
  IP: 1, // IP 定位
  MANUAL: 3, // 手动定位
  MODULE: 2, // 设备定位
} as const;

/**
 * 数据格式（编解码器类型）枚举
 */
export const CodecTypeEnum = {
  ALINK: 'Alink', // 阿里云 Alink 协议
} as const;
