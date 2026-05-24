<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Form, Input } from 'ant-design-vue';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

onMounted(() => {
  if (!isEmpty(config.value)) {
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.MQTT}`,
    url: '',
    username: '',
    password: '',
    clientId: '',
    topic: '',
  };
});
</script>

<template>
  <Form.Item
    :name="['config', 'url']"
    :rules="[{ required: true, message: '服务地址不能为空', trigger: 'blur' }]"
    label="服务地址"
  >
    <Input
      v-model:value="config.url"
      placeholder="请输入 MQTT 服务地址，如：mqtt://localhost:1883"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'username']"
    :rules="[{ required: true, message: '用户名不能为空', trigger: 'blur' }]"
    label="用户名"
  >
    <Input v-model:value="config.username" placeholder="请输入用户名" />
  </Form.Item>
  <Form.Item
    :name="['config', 'password']"
    :rules="[{ required: true, message: '密码不能为空', trigger: 'blur' }]"
    label="密码"
  >
    <Input.Password v-model:value="config.password" placeholder="请输入密码" />
  </Form.Item>
  <Form.Item
    :name="['config', 'clientId']"
    :rules="[
      { required: true, message: '客户端 ID 不能为空', trigger: 'blur' },
    ]"
    label="客户端 ID"
  >
    <Input v-model:value="config.clientId" placeholder="请输入客户端 ID" />
  </Form.Item>
  <Form.Item
    :name="['config', 'topic']"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <Input v-model:value="config.topic" placeholder="请输入主题" />
  </Form.Item>
</template>
