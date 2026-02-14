import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace IotDeviceModbusPointApi {
  /** Modbus 点位配置 VO */
  export interface ModbusPoint {
    id?: number; // 主键
    deviceId: number; // 设备编号
    thingModelId?: number; // 物模型属性编号
    identifier: string; // 属性标识符
    name: string; // 属性名称
    functionCode?: number; // Modbus 功能码
    registerAddress?: number; // 寄存器起始地址
    registerCount?: number; // 寄存器数量
    byteOrder?: string; // 字节序
    rawDataType?: string; // 原始数据类型
    scale: number; // 缩放因子
    pollInterval: number; // 轮询间隔，单位：毫秒
    status: number; // 状态
  }
}

/** 获取设备的 Modbus 点位分页 */
export function getModbusPointPage(params: PageParam) {
  return requestClient.get<PageResult<IotDeviceModbusPointApi.ModbusPoint>>(
    '/iot/device-modbus-point/page',
    { params },
  );
}

/** 获取 Modbus 点位详情 */
export function getModbusPoint(id: number) {
  return requestClient.get<IotDeviceModbusPointApi.ModbusPoint>(
    `/iot/device-modbus-point/get?id=${id}`,
  );
}

/** 创建 Modbus 点位配置 */
export function createModbusPoint(
  data: IotDeviceModbusPointApi.ModbusPoint,
) {
  return requestClient.post('/iot/device-modbus-point/create', data);
}

/** 更新 Modbus 点位配置 */
export function updateModbusPoint(
  data: IotDeviceModbusPointApi.ModbusPoint,
) {
  return requestClient.put('/iot/device-modbus-point/update', data);
}

/** 删除 Modbus 点位配置 */
export function deleteModbusPoint(id: number) {
  return requestClient.delete(`/iot/device-modbus-point/delete?id=${id}`);
}
