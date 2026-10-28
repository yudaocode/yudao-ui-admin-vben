import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

export namespace IotProductApi {
  /** 产品 */
  export interface Product {
    id?: number; // 产品编号
    name: string; // 产品名称
    productKey?: string; // 产品标识
    productSecret?: string; // 产品密钥
    protocolId?: number; // 协议编号
    protocolType?: string; // 协议类型
    categoryId?: number; // 产品所属品类标识符
    categoryName?: string; // 产品所属品类名称
    icon?: string; // 产品图标
    picUrl?: string; // 产品图片
    description?: string; // 产品描述
    status?: number; // 产品状态
    deviceType?: number; // 设备类型
    netType?: number; // 联网方式
    serializeType?: string; // 序列化类型
    registerEnabled?: boolean; // 是否开启动态注册
    deviceCount?: number; // 设备数量
    scriptContent?: null | string; // 数据解析脚本
    scriptEnabled?: boolean | null; // 是否启用数据解析脚本
    createTime?: Date; // 创建时间
  }

  /** 产品数据解析脚本更新 Request VO（只提交需要修改的字段） */
  export interface ProductScriptUpdateReq {
    id: number; // 产品编号
    scriptContent?: string; // 脚本内容
    scriptEnabled?: boolean; // 是否启用
  }

  /** 产品数据解析脚本调试 Request VO */
  export interface ProductScriptDebugReq {
    id: number; // 产品编号
    scriptContent: string; // 当前编辑的脚本内容
    direction: 'decode' | 'encode'; // 调试方向：上行解码、下行编码
    inputHex?: string; // 上行解码：输入 HEX
    message?: {
      method: string;
      params?: any;
      requestId?: string;
    }; // 下行编码：输入消息
  }

  /** 产品数据解析脚本调试 Response VO */
  export interface ProductScriptDebugResp {
    success: boolean; // 是否成功
    durationMs: number; // 执行耗时（毫秒）
    message?: null | {
      code?: number;
      data?: any;
      method: string;
      msg?: string;
      params?: any;
      requestId?: string;
    }; // 解码得到的消息；为空表示没有业务消息
    standard?: boolean; // 编码：是否使用标准编码
    outputHex?: string; // 编码得到的 HEX
    error?: {
      line?: number;
      message: string;
      type:
        | 'ENCODE_EMPTY'
        | 'ERROR'
        | 'OUTPUT_INVALID'
        | 'REJECTED'
        | 'TIMEOUT';
    }; // 错误信息
  }
}

// IoT 协议类型枚举
export enum ProtocolTypeEnum {
  COAP = 'coap',
  EMQX = 'emqx',
  HTTP = 'http',
  MODBUS_TCP_CLIENT = 'modbus_tcp_client',
  MODBUS_TCP_SERVER = 'modbus_tcp_server',
  MQTT = 'mqtt',
  TCP = 'tcp',
  UDP = 'udp',
  WEBSOCKET = 'websocket',
}

// IoT 序列化类型枚举
export enum SerializeTypeEnum {
  BINARY = 'binary',
  JSON = 'json',
}

/** 查询产品分页 */
export function getProductPage(params: PageParam) {
  return requestClient.get<PageResult<IotProductApi.Product>>(
    '/iot/product/page',
    { params },
  );
}

/** 查询产品详情 */
export function getProduct(id: number) {
  return requestClient.get<IotProductApi.Product>(`/iot/product/get?id=${id}`);
}

/** 新增产品 */
export function createProduct(data: IotProductApi.Product) {
  return requestClient.post('/iot/product/create', data);
}

/** 修改产品 */
export function updateProduct(data: IotProductApi.Product) {
  return requestClient.put('/iot/product/update', data);
}

/** 删除产品 */
export function deleteProduct(id: number) {
  return requestClient.delete(`/iot/product/delete?id=${id}`);
}

/** 导出产品 Excel */
export function exportProduct(params: any) {
  return requestClient.download('/iot/product/export-excel', { params });
}

/** 更新产品状态 */
export function updateProductStatus(id: number, status: number) {
  return requestClient.put(
    `/iot/product/update-status?id=${id}&status=${status}`,
  );
}

/** 更新产品数据解析脚本（保存内容或启停） */
export function updateProductScript(
  data: IotProductApi.ProductScriptUpdateReq,
) {
  return requestClient.put<boolean>('/iot/product/update-script', data);
}

/** 调试产品数据解析脚本（执行当前编辑内容，不保存、不下发） */
export function debugProductScript(data: IotProductApi.ProductScriptDebugReq) {
  return requestClient.post<IotProductApi.ProductScriptDebugResp>(
    '/iot/product/debug-script',
    data,
  );
}

/** 查询产品（精简）列表 */
export function getSimpleProductList(deviceType?: number) {
  return requestClient.get<IotProductApi.Product[]>(
    '/iot/product/simple-list',
    {
      params: { deviceType },
    },
  );
}

/** 根据 ProductKey 获取产品信息 */
export function getProductByKey(productKey: string) {
  return requestClient.get<IotProductApi.Product>('/iot/product/get-by-key', {
    params: { productKey },
  });
}

/** 同步产品物模型 TDengine 超级表结构 */
export function syncProductPropertyTable(id: number) {
  return requestClient.post(`/iot/product/sync-property-table?id=${id}`);
}
