import { requestClient } from '#/api/request';

export namespace IotDeviceModbusConfigApi {
  /** Modbus 连接配置 VO */
  export interface ModbusConfig {
    id?: number; // 主键
    deviceId: number; // 设备编号
    ip: string; // Modbus 服务器 IP 地址
    port: number; // Modbus 服务器端口
    slaveId: number; // 从站地址
    timeout: number; // 连接超时时间，单位：毫秒
    retryInterval: number; // 重试间隔，单位：毫秒
    mode: number; // 模式
    frameFormat: number; // 帧格式
    status: number; // 状态
  }
}

/** 获取设备的 Modbus 连接配置 */
export function getModbusConfig(deviceId: number) {
  return requestClient.get<IotDeviceModbusConfigApi.ModbusConfig>(
    '/iot/device-modbus-config/get',
    { params: { deviceId } },
  );
}

/** 保存 Modbus 连接配置 */
export function saveModbusConfig(data: IotDeviceModbusConfigApi.ModbusConfig) {
  return requestClient.post('/iot/device-modbus-config/save', data);
}
