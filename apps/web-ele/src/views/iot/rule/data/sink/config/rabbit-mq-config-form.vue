<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput, ElInputNumber } from 'element-plus';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

onMounted(() => {
  if (!isEmpty(config.value)) {
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.RABBITMQ}`,
    host: '',
    port: 5672,
    virtualHost: '/',
    username: '',
    password: '',
    exchange: '',
    routingKey: '',
    queue: '',
  };
});
</script>

<template>
  <ElFormItem
    prop="config.host"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="主机地址"
  >
    <ElInput
      v-model="config.host"
      placeholder="请输入主机地址，如：localhost"
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
    prop="config.virtualHost"
    :rules="[{ required: true, message: '虚拟主机不能为空', trigger: 'blur' }]"
    label="虚拟主机"
  >
    <ElInput v-model="config.virtualHost" placeholder="请输入虚拟主机" />
  </ElFormItem>
  <ElFormItem
    prop="config.username"
    :rules="[{ required: true, message: '用户名不能为空', trigger: 'blur' }]"
    label="用户名"
  >
    <ElInput v-model="config.username" placeholder="请输入用户名" />
  </ElFormItem>
  <ElFormItem
    prop="config.password"
    :rules="[{ required: true, message: '密码不能为空', trigger: 'blur' }]"
    label="密码"
  >
    <ElInput
      v-model="config.password"
      type="password"
      show-password
      placeholder="请输入密码"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.exchange"
    :rules="[{ required: true, message: '交换机不能为空', trigger: 'blur' }]"
    label="交换机"
  >
    <ElInput v-model="config.exchange" placeholder="请输入交换机" />
  </ElFormItem>
  <ElFormItem
    prop="config.routingKey"
    :rules="[{ required: true, message: '路由键不能为空', trigger: 'blur' }]"
    label="路由键"
  >
    <ElInput v-model="config.routingKey" placeholder="请输入路由键" />
  </ElFormItem>
  <ElFormItem
    prop="config.queue"
    :rules="[{ required: true, message: '队列不能为空', trigger: 'blur' }]"
    label="队列"
  >
    <ElInput v-model="config.queue" placeholder="请输入队列" />
  </ElFormItem>
</template>
