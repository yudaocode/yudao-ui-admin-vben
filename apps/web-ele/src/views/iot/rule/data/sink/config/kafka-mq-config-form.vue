<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput, ElSwitch } from 'element-plus';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

onMounted(() => {
  if (!isEmpty(config.value)) {
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.KAFKA}`,
    bootstrapServers: '',
    username: '',
    password: '',
    ssl: false,
    topic: '',
  };
});
</script>

<template>
  <ElFormItem
    prop="config.bootstrapServers"
    :rules="[{ required: true, message: '服务地址不能为空', trigger: 'blur' }]"
    label="服务地址"
  >
    <ElInput
      v-model="config.bootstrapServers"
      placeholder="请输入服务地址，如：localhost:9092"
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
  <ElFormItem prop="config.ssl" label="启用 SSL">
    <ElSwitch v-model="config.ssl" />
  </ElFormItem>
  <ElFormItem
    prop="config.topic"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <ElInput v-model="config.topic" placeholder="请输入主题" />
  </ElFormItem>
</template>
