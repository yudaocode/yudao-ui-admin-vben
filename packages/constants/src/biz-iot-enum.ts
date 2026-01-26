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
 * 数据格式（编解码器类型）枚举
 */
export const CodecTypeEnum = {
  ALINK: 'Alink', // 阿里云 Alink 协议
} as const;

/**
 * IoT 设备消息的方法枚举
 */
export const IotDeviceMessageMethodEnum = {
  // ========== 设备状态 ==========
  STATE_UPDATE: {
    method: 'thing.state.update',
    name: '设备状态更新',
    upstream: true,
  },

  // ========== 拓扑管理 ==========
  TOPO_ADD: {
    method: 'thing.topo.add',
    name: '添加拓扑关系',
    upstream: true,
  },
  TOPO_DELETE: {
    method: 'thing.topo.delete',
    name: '删除拓扑关系',
    upstream: true,
  },
  TOPO_GET: {
    method: 'thing.topo.get',
    name: '获取拓扑关系',
    upstream: true,
  },
  TOPO_CHANGE: {
    method: 'thing.topo.change',
    name: '拓扑关系变更通知',
    upstream: false,
  },

  // ========== 设备注册 ==========
  DEVICE_REGISTER: {
    method: 'thing.auth.register',
    name: '设备动态注册',
    upstream: true,
  },
  SUB_DEVICE_REGISTER: {
    method: 'thing.auth.register.sub',
    name: '子设备动态注册',
    upstream: true,
  },

  // ========== 设备属性 ==========
  PROPERTY_POST: {
    method: 'thing.property.post',
    name: '属性上报',
    upstream: true,
  },
  PROPERTY_SET: {
    method: 'thing.property.set',
    name: '属性设置',
    upstream: false,
  },
  PROPERTY_PACK_POST: {
    method: 'thing.event.property.pack.post',
    name: '批量上报（属性 + 事件 + 子设备）',
    upstream: true,
  },

  // ========== 设备事件 ==========
  EVENT_POST: {
    method: 'thing.event.post',
    name: '事件上报',
    upstream: true,
  },

  // ========== 服务调用 ==========
  SERVICE_INVOKE: {
    method: 'thing.service.invoke',
    name: '服务调用',
    upstream: false,
  },

  // ========== 设备配置 ==========
  CONFIG_PUSH: {
    method: 'thing.config.push',
    name: '配置推送',
    upstream: false,
  },

  // ========== OTA 固件 ==========
  OTA_UPGRADE: {
    method: 'thing.ota.upgrade',
    name: 'OTA 固件信息推送',
    upstream: false,
  },
  OTA_PROGRESS: {
    method: 'thing.ota.progress',
    name: 'OTA 升级进度上报',
    upstream: true,
  },
} as const;
