import type { PageParam, PageResult } from '@vben/request';

import { requestClient } from '#/api/request';

interface BaseConfig {
  type: string;
}

export namespace DataSinkApi {
  /** IoT 数据流转目的 VO */
  export interface DataSink {
    id?: number;
    name?: string;
    description?: string;
    status?: number;
    direction?: number;
    type?: number;
    config?:
      | DatabaseConfig
      | HttpConfig
      | KafkaMQConfig
      | MqttConfig
      | RabbitMQConfig
      | RedisStreamMQConfig
      | RocketMQConfig
      | TcpConfig
      | WebSocketConfig;
    createTime?: Date;
  }

  /** HTTP 配置 */
  export interface HttpConfig extends BaseConfig {
    url: string;
    method: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string;
  }

  /** TCP 配置 */
  export interface TcpConfig extends BaseConfig {
    host: string;
    port: number;
    connectTimeoutMs: number;
    readTimeoutMs: number;
    ssl: boolean;
    sslCertPath: string;
    dataFormat: string;
    heartbeatIntervalMs: number;
    reconnectIntervalMs: number;
    maxReconnectAttempts: number;
  }

  /** WebSocket 配置 */
  export interface WebSocketConfig extends BaseConfig {
    serverUrl: string;
    connectTimeoutMs: number;
    sendTimeoutMs: number;
    heartbeatIntervalMs: number;
    heartbeatMessage: string;
    subprotocols: string;
    customHeaders: string;
    verifySslCert: boolean;
    dataFormat: string;
    reconnectIntervalMs: number;
    maxReconnectAttempts: number;
    enableCompression: boolean;
    sendRetryCount: number;
    sendRetryIntervalMs: number;
  }

  /** MQTT 配置 */
  export interface MqttConfig extends BaseConfig {
    url: string;
    username: string;
    password: string;
    clientId: string;
    topic: string;
  }

  /** Database 配置 */
  export interface DatabaseConfig extends BaseConfig {
    jdbcUrl: string;
    username: string;
    password: string;
    tableName: string;
  }

  /** RocketMQ 配置 */
  export interface RocketMQConfig extends BaseConfig {
    nameServer: string;
    accessKey: string;
    secretKey: string;
    group: string;
    topic: string;
    tags: string;
  }

  /** Kafka 配置 */
  export interface KafkaMQConfig extends BaseConfig {
    bootstrapServers: string;
    username: string;
    password: string;
    ssl: boolean;
    topic: string;
  }

  /** RabbitMQ 配置 */
  export interface RabbitMQConfig extends BaseConfig {
    host: string;
    port: number;
    virtualHost: string;
    username: string;
    password: string;
    exchange: string;
    routingKey: string;
    queue: string;
  }

  /** Redis Stream MQ 配置 */
  export interface RedisStreamMQConfig extends BaseConfig {
    host: string;
    port: number;
    password: string;
    database: number;
    topic: string;
  }
}

/** 数据流转目的类型 */
export const IotDataSinkTypeEnum = {
  HTTP: 1,
  TCP: 2,
  WEBSOCKET: 3,
  MQTT: 10,
  DATABASE: 20,
  REDIS_STREAM: 21,
  ROCKETMQ: 30,
  RABBITMQ: 31,
  KAFKA: 32,
} as const;

/** 查询数据流转目的分页 */
export function getDataSinkPage(params: PageParam) {
  return requestClient.get<PageResult<DataSinkApi.DataSink>>(
    '/iot/data-sink/page',
    { params },
  );
}

/** 查询数据流转目的详情 */
export function getDataSink(id: number) {
  return requestClient.get<DataSinkApi.DataSink>(`/iot/data-sink/get?id=${id}`);
}

/** 查询数据流转目的（精简）列表 */
export function getDataSinkSimpleList() {
  return requestClient.get<DataSinkApi.DataSink[]>(
    '/iot/data-sink/simple-list',
  );
}

/** 新增数据流转目的 */
export function createDataSink(data: DataSinkApi.DataSink) {
  return requestClient.post('/iot/data-sink/create', data);
}

/** 修改数据流转目的 */
export function updateDataSink(data: DataSinkApi.DataSink) {
  return requestClient.put('/iot/data-sink/update', data);
}

/** 删除数据流转目的 */
export function deleteDataSink(id: number) {
  return requestClient.delete(`/iot/data-sink/delete?id=${id}`);
}
