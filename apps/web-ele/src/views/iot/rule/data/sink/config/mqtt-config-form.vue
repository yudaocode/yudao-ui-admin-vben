<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput } from 'element-plus';

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
  <ElFormItem
    prop="config.url"
    :rules="[{ required: true, message: '服务地址不能为空', trigger: 'blur' }]"
    label="服务地址"
  >
    <ElInput
      v-model="config.url"
      placeholder="请输入 MQTT 服务地址，如：mqtt://localhost:1883"
    />
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
    prop="config.clientId"
    :rules="[
      { required: true, message: '客户端 ID 不能为空', trigger: 'blur' },
    ]"
    label="客户端 ID"
  >
    <ElInput v-model="config.clientId" placeholder="请输入客户端 ID" />
  </ElFormItem>
  <ElFormItem
    prop="config.topic"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <ElInput v-model="config.topic" placeholder="请输入主题" />
  </ElFormItem>
</template>
