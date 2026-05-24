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
  <Form.Item
    :name="['config', 'nameServer']"
    :rules="[
      { required: true, message: 'NameServer 地址不能为空', trigger: 'blur' },
    ]"
    label="NameServer"
  >
    <Input
      v-model:value="config.nameServer"
      placeholder="请输入 NameServer 地址，如：127.0.0.1:9876"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'accessKey']"
    :rules="[
      { required: true, message: 'AccessKey 不能为空', trigger: 'blur' },
    ]"
    label="AccessKey"
  >
    <Input v-model:value="config.accessKey" placeholder="请输入 AccessKey" />
  </Form.Item>
  <Form.Item
    :name="['config', 'secretKey']"
    :rules="[
      { required: true, message: 'SecretKey 不能为空', trigger: 'blur' },
    ]"
    label="SecretKey"
  >
    <Input.Password
      v-model:value="config.secretKey"
      placeholder="请输入 SecretKey"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'group']"
    :rules="[{ required: true, message: '消费组不能为空', trigger: 'blur' }]"
    label="消费组"
  >
    <Input v-model:value="config.group" placeholder="请输入消费组" />
  </Form.Item>
  <Form.Item
    :name="['config', 'topic']"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <Input v-model:value="config.topic" placeholder="请输入主题" />
  </Form.Item>
  <Form.Item :name="['config', 'tags']" label="标签">
    <Input v-model:value="config.tags" placeholder="请输入标签" />
  </Form.Item>
</template>
