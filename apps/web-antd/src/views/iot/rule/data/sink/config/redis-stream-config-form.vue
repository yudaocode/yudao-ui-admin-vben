<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Form, Input, InputNumber, Select } from 'ant-design-vue';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

const REDIS_DATA_STRUCTURE_OPTIONS = [
  { label: 'Stream', value: 1 },
  { label: 'Hash', value: 2 },
  { label: 'List', value: 3 },
  { label: 'Set', value: 4 },
  { label: 'ZSet', value: 5 },
  { label: 'String', value: 6 },
]; // Redis 数据结构枚举（与后端 IotRedisDataStructureEnum 对应）

const isHash = computed(() => Number(config.value?.dataStructure) === 2);
const isZSet = computed(() => Number(config.value?.dataStructure) === 5);

onMounted(() => {
  if (!isEmpty(config.value)) {
    if (config.value.dataStructure == null) {
      config.value.dataStructure = 1;
    }
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.REDIS_STREAM}`,
    host: '',
    port: 6379,
    password: '',
    database: 0,
    topic: '',
    dataStructure: 1,
  };
});
</script>

<template>
  <Form.Item
    :name="['config', 'host']"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="主机地址"
  >
    <Input
      v-model:value="config.host"
      placeholder="请输入主机地址，如：localhost"
    />
  </Form.Item>
  <Form.Item
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
  </Form.Item>
  <Form.Item :name="['config', 'password']" label="密码">
    <Input.Password v-model:value="config.password" placeholder="请输入密码" />
  </Form.Item>
  <Form.Item
    :name="['config', 'database']"
    :rules="[
      { required: true, message: '数据库索引不能为空', trigger: 'blur' },
      {
        type: 'number',
        min: 0,
        message: '数据库索引必须是非负整数',
        trigger: 'blur',
      },
    ]"
    label="数据库"
  >
    <InputNumber
      v-model:value="config.database"
      :max="15"
      :min="0"
      placeholder="请输入数据库索引"
      class="w-full"
    />
  </Form.Item>
  <Form.Item
    :name="['config', 'topic']"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <Input v-model:value="config.topic" placeholder="请输入主题" />
  </Form.Item>
  <Form.Item
    :name="['config', 'dataStructure']"
    :rules="[
      { required: true, message: 'Redis 数据结构不能为空', trigger: 'change' },
    ]"
    label="数据结构"
  >
    <Select
      v-model:value="config.dataStructure"
      :options="REDIS_DATA_STRUCTURE_OPTIONS"
      placeholder="请选择 Redis 数据结构"
    />
  </Form.Item>
  <Form.Item
    v-if="isHash"
    :name="['config', 'hashField']"
    label="Hash 字段"
  >
    <Input
      v-model:value="config.hashField"
      placeholder="留空使用 deviceId 作为 Hash 字段"
    />
  </Form.Item>
  <Form.Item
    v-if="isZSet"
    :name="['config', 'scoreField']"
    label="Score 字段"
  >
    <Input
      v-model:value="config.scoreField"
      placeholder="留空使用当前时间戳作为 Score"
    />
  </Form.Item>
</template>
