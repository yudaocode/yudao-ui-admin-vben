import type { ThingModelApi } from '#/api/iot/thingmodel';

import { requestClient } from '#/api/request';

export namespace IotDeviceShadowApi {
  /** 设备影子属性对比 VO */
  export interface ShadowProperty {
    identifier: string; // 属性标识符
    name: string; // 属性名称
    dataType: string; // 数据类型
    dataSpecs?: ThingModelApi.ThingModelDataSpecs; // 数据定义
    dataSpecsList?: ThingModelApi.ThingModelPropertyDataSpecs[]; // 数据定义列表
    desiredValue?: any; // 期望值
    reportedValue?: any; // 上报值
    desiredTime?: number; // 期望值更新时间（epoch 秒）
    reportedTime?: number; // 上报值更新时间（epoch 秒）
  }

  /** 设备影子 VO */
  export interface Shadow {
    version: number; // 版本号
    shadowTime: number; // 影子最后更新时间（epoch 秒）
    status: number; // 影子开关状态
    properties: ShadowProperty[]; // 属性对比列表
    desired: Record<string, any>; // 期望状态
    reported: Record<string, any>; // 上报状态
    metadata: Record<string, any>; // 元数据
  }

  /** 设备影子更新期望状态 Request VO */
  export interface ShadowUpdateDesiredReqVO {
    deviceId: number; // 设备编号
    desired: Record<string, any>; // 期望状态
  }

  /** 设备影子更新开关状态 Request VO */
  export interface ShadowUpdateStatusReqVO {
    deviceId: number; // 设备编号
    status: number; // 开关状态
  }
}

/** 获取设备影子 */
export function getDeviceShadow(deviceId: number) {
  return requestClient.get<IotDeviceShadowApi.Shadow>(
    `/iot/device/shadow/get?deviceId=${deviceId}`,
  );
}

/** 更新设备影子期望状态 */
export function updateDeviceShadowDesired(
  data: IotDeviceShadowApi.ShadowUpdateDesiredReqVO,
) {
  return requestClient.put<boolean>('/iot/device/shadow/update-desired', data);
}

/** 更新设备影子开关状态 */
export function updateDeviceShadowStatus(
  data: IotDeviceShadowApi.ShadowUpdateStatusReqVO,
) {
  return requestClient.put<boolean>('/iot/device/shadow/update-status', data);
}

/** 重置设备影子 */
export function resetDeviceShadow(deviceId: number) {
  return requestClient.delete<boolean>(
    `/iot/device/shadow/reset?deviceId=${deviceId}`,
  );
}
