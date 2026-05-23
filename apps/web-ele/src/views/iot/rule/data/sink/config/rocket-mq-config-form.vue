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
    type: `${IotDataSinkTypeEnum.ROCKETMQ}`,
    nameServer: '',
    accessKey: '',
    secretKey: '',
    group: '',
    topic: '',
    tags: '',
  };
});
</script>

<template>
  <ElFormItem
    prop="config.nameServer"
    :rules="[
      { required: true, message: 'NameServer 地址不能为空', trigger: 'blur' },
    ]"
    label="NameServer"
  >
    <ElInput
      v-model="config.nameServer"
      placeholder="请输入 NameServer 地址，如：127.0.0.1:9876"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.accessKey"
    :rules="[
      { required: true, message: 'AccessKey 不能为空', trigger: 'blur' },
    ]"
    label="AccessKey"
  >
    <ElInput v-model="config.accessKey" placeholder="请输入 AccessKey" />
  </ElFormItem>
  <ElFormItem
    prop="config.secretKey"
    :rules="[
      { required: true, message: 'SecretKey 不能为空', trigger: 'blur' },
    ]"
    label="SecretKey"
  >
    <ElInput
      v-model="config.secretKey"
      type="password"
      show-password
      placeholder="请输入 SecretKey"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.group"
    :rules="[{ required: true, message: '消费组不能为空', trigger: 'blur' }]"
    label="消费组"
  >
    <ElInput v-model="config.group" placeholder="请输入消费组" />
  </ElFormItem>
  <ElFormItem
    prop="config.topic"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <ElInput v-model="config.topic" placeholder="请输入主题" />
  </ElFormItem>
  <ElFormItem prop="config.tags" label="标签">
    <ElInput v-model="config.tags" placeholder="请输入标签" />
  </ElFormItem>
</template>
