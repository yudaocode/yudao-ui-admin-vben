<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { FormItem, Input, InputNumber } from 'antdv-next';

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
  <FormItem
    :name="['config', 'host']"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="主机地址"
  >
    <Input
      v-model:value="config.host"
      placeholder="请输入主机地址，如：localhost"
    />
  </FormItem>
  <FormItem
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
  </FormItem>
  <FormItem
    :name="['config', 'virtualHost']"
    :rules="[{ required: true, message: '虚拟主机不能为空', trigger: 'blur' }]"
    label="虚拟主机"
  >
    <Input v-model:value="config.virtualHost" placeholder="请输入虚拟主机" />
  </FormItem>
  <FormItem
    :name="['config', 'username']"
    :rules="[{ required: true, message: '用户名不能为空', trigger: 'blur' }]"
    label="用户名"
  >
    <Input v-model:value="config.username" placeholder="请输入用户名" />
  </FormItem>
  <FormItem
    :name="['config', 'password']"
    :rules="[{ required: true, message: '密码不能为空', trigger: 'blur' }]"
    label="密码"
  >
    <Input.Password v-model:value="config.password" placeholder="请输入密码" />
  </FormItem>
  <FormItem
    :name="['config', 'exchange']"
    :rules="[{ required: true, message: '交换机不能为空', trigger: 'blur' }]"
    label="交换机"
  >
    <Input v-model:value="config.exchange" placeholder="请输入交换机" />
  </FormItem>
  <FormItem
    :name="['config', 'routingKey']"
    :rules="[{ required: true, message: '路由键不能为空', trigger: 'blur' }]"
    label="路由键"
  >
    <Input v-model:value="config.routingKey" placeholder="请输入路由键" />
  </FormItem>
  <FormItem
    :name="['config', 'queue']"
    :rules="[{ required: true, message: '队列不能为空', trigger: 'blur' }]"
    label="队列"
  >
    <Input v-model:value="config.queue" placeholder="请输入队列" />
  </FormItem>
</template>
