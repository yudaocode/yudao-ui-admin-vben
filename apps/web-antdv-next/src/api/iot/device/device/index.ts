import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace IotDeviceApi {
  /** 设备 */
  export interface Device {
    id?: number; // 设备编号
    deviceName: string; // 设备名称
    nickname?: string; // 备注名称
    serialNumber?: string; // 设备序列号
    picUrl?: string; // 设备图片
    groupIds?: number[]; // 设备分组编号数组
    productId: number; // 产品编号
    productKey?: string; // 产品标识
    productName?: string; // 产品名称（只有部分接口返回，例如 getDeviceLocationList）
    deviceType?: number; // 设备类型
    gatewayId?: number; // 网关设备 ID
    state?: number; // 设备状态
    onlineTime?: Date; // 最后上线时间
    offlineTime?: Date; // 最后离线时间
    activeTime?: Date; // 设备激活时间
    deviceSecret?: string; // 设备密钥，用于设备认证
    config?: string; // 设备配置
    latitude?: number; // 设备位置的纬度
    longitude?: number; // 设备位置的经度
    createTime?: Date; // 创建时间
  }

  /** 设备更新分组 Request VO */
  export interface DeviceUpdateGroupReqVO {
    ids: number[]; // 设备编号列表（必填）
    groupIds: number[]; // 分组编号列表（必填）
  }

  /** 设备认证信息 Response VO */
  export interface DeviceAuthInfoRespVO {
    clientId: string; // 客户端 ID
    username: string; // 用户名
    password: string; // 密码
  }

  /** 设备导入 Response VO */
  export interface DeviceImportRespVO {
    createDeviceNames?: string[]; // 创建成功的设备名称列表
    updateDeviceNames?: string[]; // 更新成功的设备名称列表
    failureDeviceNames?: Record<string, string>; // 失败的设备名称及原因
  }

  /** IoT 设备属性详细 VO */
  export interface DevicePropertyDetail {
    identifier: string; // 属性标识符
    value: string; // 最新值
    updateTime: Date; // 更新时间
    name: string; // 属性名称
    dataType: string; // 数据类型
    dataSpecs: any; // 数据定义
    dataSpecsList: any[]; // 数据定义列表
  }

  /** 设备属性 VO */
  export interface DeviceProperty {
    identifier: string; // 属性标识符
    value: string; // 最新值
    updateTime: Date; // 更新时间
  }

  /** 设备发送消息 Request VO */
  export interface DeviceMessageSendReq {
    deviceId: number; // 设备编号
    method: string; // 请求方法
    params?: any; // 请求参数
  }
}

/** 查询设备分页 */
export function getDevicePage(params: PageParam) {
  return requestClient.get<PageResult<IotDeviceApi.Device>>(
    '/iot/device/page',
    { params },
  );
}

/** 查询设备详情 */
export function getDevice(id: number) {
  return requestClient.get<IotDeviceApi.Device>(`/iot/device/get?id=${id}`);
}

/** 新增设备 */
export function createDevice(data: IotDeviceApi.Device) {
  return requestClient.post<number>('/iot/device/create', data);
}

/** 修改设备 */
export function updateDevice(data: IotDeviceApi.Device) {
  return requestClient.put<boolean>('/iot/device/update', data);
}

/** 修改设备分组 */
export function updateDeviceGroup(data: IotDeviceApi.DeviceUpdateGroupReqVO) {
  return requestClient.put<boolean>('/iot/device/update-group', data);
}

/** 删除单个设备 */
export function deleteDevice(id: number) {
  return requestClient.delete<boolean>(`/iot/device/delete?id=${id}`);
}

/** 删除多个设备 */
export function deleteDeviceList(ids: number[]) {
  return requestClient.delete<boolean>('/iot/device/delete-list', {
    params: { ids: ids.join(',') },
  });
}

/** 导出设备 */
export function exportDeviceExcel(params: PageParam) {
  return requestClient.download('/iot/device/export-excel', { params });
}

/** 获取设备数量 */
export function getDeviceCount(productId: number) {
  return requestClient.get<number>(`/iot/device/count?productId=${productId}`);
}

/** 获取设备的精简信息列表 */
export function getSimpleDeviceList(deviceType?: number, productId?: number) {
  return requestClient.get<IotDeviceApi.Device[]>('/iot/device/simple-list', {
    params: { deviceType, productId },
  });
}

/** 根据产品编号，获取设备的精简信息列表 */
export function getDeviceListByProductId(productId: number) {
  return requestClient.get<IotDeviceApi.Device[]>('/iot/device/simple-list', {
    params: { productId },
  });
}

/** 获取设备位置列表（用于地图展示） */
export function getDeviceLocationList() {
  return requestClient.get<IotDeviceApi.Device[]>('/iot/device/location-list');
}

/** 获取导入模板 */
export function importDeviceTemplate() {
  return requestClient.download('/iot/device/get-import-template');
}

/** 导入设备 */
export function importDevice(file: File, updateSupport: boolean) {
  return requestClient.upload<IotDeviceApi.DeviceImportRespVO>(
    '/iot/device/import',
    {
      file,
      updateSupport,
    },
  );
}

/** 获取设备属性最新数据 */
export function getLatestDeviceProperties(params: any) {
  return requestClient.get<IotDeviceApi.DevicePropertyDetail[]>(
    '/iot/device/property/get-latest',
    { params },
  );
}

/** 获取设备属性历史数据 */
export function getHistoryDevicePropertyList(params: any) {
  return requestClient.get<PageResult<IotDeviceApi.DeviceProperty>>(
    '/iot/device/property/history-list',
    { params },
  );
}

/** 获取设备认证信息 */
export function getDeviceAuthInfo(id: number) {
  return requestClient.get<IotDeviceApi.DeviceAuthInfoRespVO>(
    '/iot/device/get-auth-info',
    { params: { id } },
  );
}

/** 查询设备消息分页 */
export function getDeviceMessagePage(params: PageParam) {
  return requestClient.get<PageResult<any>>('/iot/device/message/page', {
    params,
  });
}

/** 查询设备消息配对分页 */
export function getDeviceMessagePairPage(params: PageParam) {
  return requestClient.get<PageResult<any>>('/iot/device/message/pair-page', {
    params,
  });
}

/** 发送设备消息 */
export function sendDeviceMessage(params: IotDeviceApi.DeviceMessageSendReq) {
  return requestClient.post('/iot/device/message/send', params);
}

/** 绑定子设备到网关设备 */
export function bindDeviceGateway(gatewayId: number, subIds: number[]) {
  return requestClient.put<boolean>('/iot/device/bind-gateway', {
    gatewayId,
    subIds,
  });
}

/** 解绑子设备与网关设备 */
export function unbindDeviceGateway(gatewayId: number, subIds: number[]) {
  return requestClient.put<boolean>('/iot/device/unbind-gateway', {
    gatewayId,
    subIds,
  });
}

/** 获取网关设备的子设备列表 */
export function getSubDeviceList(gatewayId: number) {
  return requestClient.get<IotDeviceApi.Device[]>(
    '/iot/device/sub-device-list',
    { params: { gatewayId } },
  );
}

/** 获取未绑定的子设备分页 */
export function getUnboundSubDevicePage(params: PageParam) {
  return requestClient.get<PageResult<IotDeviceApi.Device>>(
    '/iot/device/unbound-sub-device-page',
    { params },
  );
}
