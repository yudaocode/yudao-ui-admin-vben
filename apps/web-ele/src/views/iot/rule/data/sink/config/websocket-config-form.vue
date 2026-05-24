<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import {
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
} from 'element-plus';

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
  <ElFormItem
    prop="config.serverUrl"
    :rules="[
      {
        required: true,
        message: 'WebSocket 服务器地址不能为空',
        trigger: 'blur',
      },
    ]"
    label="服务器地址"
  >
    <ElInput
      v-model="config.serverUrl"
      placeholder="请输入 WebSocket 地址，如：ws://localhost:8080/ws"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.connectTimeoutMs"
    :rules="[
      { required: true, message: '连接超时时间不能为空', trigger: 'blur' },
    ]"
    label="连接超时(ms)"
  >
    <ElInputNumber
      v-model="config.connectTimeoutMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.sendTimeoutMs"
    :rules="[
      { required: true, message: '发送超时时间不能为空', trigger: 'blur' },
    ]"
    label="发送超时(ms)"
  >
    <ElInputNumber
      v-model="config.sendTimeoutMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem prop="config.heartbeatIntervalMs" label="心跳间隔(ms)">
    <ElInputNumber
      v-model="config.heartbeatIntervalMs"
      :min="0"
      :step="1000"
      placeholder="0 表示不启用心跳"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem prop="config.heartbeatMessage" label="心跳消息">
    <ElInput
      v-model="config.heartbeatMessage"
      placeholder="请输入心跳消息内容（JSON 格式）"
    />
  </ElFormItem>
  <ElFormItem prop="config.subprotocols" label="子协议">
    <ElInput
      v-model="config.subprotocols"
      placeholder="请输入子协议列表，多个用逗号分隔"
    />
  </ElFormItem>
  <ElFormItem prop="config.customHeaders" label="自定义请求头">
    <ElInput
      v-model="config.customHeaders"
      type="textarea"
      placeholder="请输入自定义请求头（JSON 格式）"
      :rows="3"
    />
  </ElFormItem>
  <ElFormItem prop="config.verifySslCert" label="验证 SSL 证书">
    <ElSwitch v-model="config.verifySslCert" />
  </ElFormItem>
  <ElFormItem
    prop="config.dataFormat"
    :rules="[
      { required: true, message: '数据格式不能为空', trigger: 'change' },
    ]"
    label="数据格式"
  >
    <ElSelect v-model="config.dataFormat" placeholder="请选择数据格式">
      <ElOption label="JSON" value="JSON" />
      <ElOption label="TEXT" value="TEXT" />
    </ElSelect>
  </ElFormItem>
  <ElFormItem prop="config.reconnectIntervalMs" label="重连间隔(ms)">
    <ElInputNumber
      v-model="config.reconnectIntervalMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem prop="config.maxReconnectAttempts" label="最大重连次数">
    <ElInputNumber
      v-model="config.maxReconnectAttempts"
      :min="0"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem prop="config.enableCompression" label="启用压缩">
    <ElSwitch v-model="config.enableCompression" />
  </ElFormItem>
  <ElFormItem prop="config.sendRetryCount" label="发送重试次数">
    <ElInputNumber v-model="config.sendRetryCount" :min="0" class="w-full" />
  </ElFormItem>
  <ElFormItem prop="config.sendRetryIntervalMs" label="重试间隔(ms)">
    <ElInputNumber
      v-model="config.sendRetryIntervalMs"
      :min="100"
      :step="500"
      class="w-full"
    />
  </ElFormItem>
</template>
