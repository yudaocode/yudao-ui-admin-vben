<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { FormItem, Input, Switch } from 'antdv-next';

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
  <FormItem
    :name="['config', 'bootstrapServers']"
    :rules="[{ required: true, message: '服务地址不能为空', trigger: 'blur' }]"
    label="服务地址"
  >
    <Input
      v-model:value="config.bootstrapServers"
      placeholder="请输入服务地址，如：localhost:9092"
    />
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
  <FormItem :name="['config', 'ssl']" label="启用 SSL">
    <Switch v-model:checked="config.ssl" />
  </FormItem>
  <FormItem
    :name="['config', 'topic']"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <Input v-model:value="config.topic" placeholder="请输入主题" />
  </FormItem>
</template>
