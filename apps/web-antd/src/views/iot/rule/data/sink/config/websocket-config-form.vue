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
    type: `${IotDataSinkTypeEnum.WEBSOCKET}`,
    serverUrl: '',
    connectTimeoutMs: 5000,
    sendTimeoutMs: 10_000,
    heartbeatIntervalMs: 30_000,
    heartbeatMessage: '{"type":"heartbeat"}',
    subprotocols: '',
    customHeaders: '',
    verifySslCert: true,
    dataFormat: 'JSON',
    reconnectIntervalMs: 5000,
    maxReconnectAttempts: 3,
    enableCompression: false,
    sendRetryCount: 1,
    sendRetryIntervalMs: 1000,
  };
});
</script>

<template>
  <Form.Item
    :name="['config', 'serverUrl']"
    :rules="[
      {
        required: true,
        message: 'WebSocket 服务器地址不能为空',
        trigger: 'blur',
      },
    ]"
    label="服务器地址"
  >
    <Input
      v-model:value="config.serverUrl"
      placeholder="请输入 WebSocket 地址，如：ws://localhost:8080/ws"
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
    :name="['config', 'sendTimeoutMs']"
    :rules="[
      { required: true, message: '发送超时时间不能为空', trigger: 'blur' },
    ]"
    label="发送超时(ms)"
  >
    <InputNumber
      v-model:value="config.sendTimeoutMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
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
  <Form.Item :name="['config', 'heartbeatMessage']" label="心跳消息">
    <Input
      v-model:value="config.heartbeatMessage"
      placeholder="请输入心跳消息内容（JSON 格式）"
    />
  </Form.Item>
  <Form.Item :name="['config', 'subprotocols']" label="子协议">
    <Input
      v-model:value="config.subprotocols"
      placeholder="请输入子协议列表，多个用逗号分隔"
    />
  </Form.Item>
  <Form.Item :name="['config', 'customHeaders']" label="自定义请求头">
    <Input.TextArea
      v-model:value="config.customHeaders"
      placeholder="请输入自定义请求头（JSON 格式）"
      :rows="3"
    />
  </Form.Item>
  <Form.Item :name="['config', 'verifySslCert']" label="验证 SSL 证书">
    <Switch v-model:checked="config.verifySslCert" />
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
      <Select.Option value="TEXT">TEXT</Select.Option>
    </Select>
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
  <Form.Item :name="['config', 'enableCompression']" label="启用压缩">
    <Switch v-model:checked="config.enableCompression" />
  </Form.Item>
  <Form.Item :name="['config', 'sendRetryCount']" label="发送重试次数">
    <InputNumber
      v-model:value="config.sendRetryCount"
      :min="0"
      class="w-full"
    />
  </Form.Item>
  <Form.Item :name="['config', 'sendRetryIntervalMs']" label="重试间隔(ms)">
    <InputNumber
      v-model:value="config.sendRetryIntervalMs"
      :min="100"
      :step="500"
      class="w-full"
    />
  </Form.Item>
</template>
