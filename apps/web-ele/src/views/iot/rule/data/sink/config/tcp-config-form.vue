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
  <ElFormItem
    prop="config.host"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="服务器地址"
  >
    <ElInput
      v-model="config.host"
      placeholder="请输入 TCP 服务器地址，如：localhost"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.port"
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
    <ElInputNumber
      v-model="config.port"
      :max="65535"
      :min="1"
      placeholder="请输入端口"
      class="w-full"
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
    prop="config.readTimeoutMs"
    :rules="[
      { required: true, message: '读取超时时间不能为空', trigger: 'blur' },
    ]"
    label="读取超时(ms)"
  >
    <ElInputNumber
      v-model="config.readTimeoutMs"
      :min="1000"
      :step="1000"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem prop="config.ssl" label="启用 SSL">
    <ElSwitch v-model="config.ssl" />
  </ElFormItem>
  <ElFormItem v-if="config.ssl" prop="config.sslCertPath" label="SSL 证书路径">
    <ElInput v-model="config.sslCertPath" placeholder="请输入 SSL 证书路径" />
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
      <ElOption label="BINARY" value="BINARY" />
    </ElSelect>
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
</template>
