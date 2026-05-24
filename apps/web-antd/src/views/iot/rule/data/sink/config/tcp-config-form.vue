<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Form, Input, InputNumber, Select, Switch } from 'ant-design-vue';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

onMounted(() => {
  if (!isEmpty(config.value)) {
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.TCP}`,
    host: '',
    port: 8080,
    connectTimeoutMs: 5000,
    readTimeoutMs: 10_000,
    ssl: false,
    sslCertPath: '',
    dataFormat: 'JSON',
    heartbeatIntervalMs: 30_000,
    reconnectIntervalMs: 5000,
    maxReconnectAttempts: 3,
  };
});
</script>

<template>
  <Form.Item
    :name="['config', 'host']"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="服务器地址"
  >
    <Input
      v-model:value="config.host"
      placeholder="请输入 TCP 服务器地址，如：localhost"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'port']"
    :rules="[
      { required: true, message: '端口不能为空', trigger: 'blur' },
      {
        type: 'number',
        min: 1,
        max: 65_535,
        message: '端口号范围 1-65535',
        trigger: 'blur',
      },
    ]"
    label="端口"
  >
    <InputNumber
      v-model:value="config.port"
      :max="65535"
      :min="1"
      placeholder="请输入端口"
      class="w-full"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'connectTimeoutMs']"
    :rules="[
      { required: true, message: '连接超时时间不能为空', trigger: 'blur' },
    ]"
    label="连接超时(ms)"
  >
    <InputNumber
      v-model:value="config.connectTimeoutMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'readTimeoutMs']"
    :rules="[
      { required: true, message: '读取超时时间不能为空', trigger: 'blur' },
    ]"
    label="读取超时(ms)"
  >
    <InputNumber
      v-model:value="config.readTimeoutMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </Form.Item>
  <Form.Item :name="['config', 'ssl']" label="启用 SSL">
    <Switch v-model:checked="config.ssl" />
  </Form.Item>
  <Form.Item
    v-if="config.ssl"
    :name="['config', 'sslCertPath']"
    label="SSL 证书路径"
  >
    <Input
      v-model:value="config.sslCertPath"
      placeholder="请输入 SSL 证书路径"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'dataFormat']"
    :rules="[
      { required: true, message: '数据格式不能为空', trigger: 'change' },
    ]"
    label="数据格式"
  >
    <Select v-model:value="config.dataFormat" placeholder="请选择数据格式">
      <Select.Option value="JSON">JSON</Select.Option>
      <Select.Option value="BINARY">BINARY</Select.Option>
    </Select>
  </Form.Item>
  <Form.Item :name="['config', 'heartbeatIntervalMs']" label="心跳间隔(ms)">
    <InputNumber
      v-model:value="config.heartbeatIntervalMs"
      :min="0"
      :step="1000"
      placeholder="0 表示不启用心跳"
      class="w-full"
    />
  </Form.Item>
  <Form.Item :name="['config', 'reconnectIntervalMs']" label="重连间隔(ms)">
    <InputNumber
      v-model:value="config.reconnectIntervalMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </Form.Item>
  <Form.Item :name="['config', 'maxReconnectAttempts']" label="最大重连次数">
    <InputNumber
      v-model:value="config.maxReconnectAttempts"
      :min="0"
      class="w-full"
    />
  </Form.Item>
</template>
