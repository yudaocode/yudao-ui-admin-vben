<script lang="ts" setup>

import { computed, onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import {
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
} from 'element-plus';

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
  <ElFormItem
    prop="config.host"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="主机地址"
  >
    <ElInput v-model="config.host" placeholder="请输入主机地址，如：localhost" />
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
  <ElFormItem prop="config.password" label="密码">
    <ElInput
      v-model="config.password"
      type="password"
      show-password
      placeholder="请输入密码"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.database"
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
    <ElInputNumber
      v-model="config.database"
      :max="15"
      :min="0"
      placeholder="请输入数据库索引"
      class="w-full"
    />
  </ElFormItem>
  <ElFormItem
    prop="config.topic"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <ElInput v-model="config.topic" placeholder="请输入主题" />
  </ElFormItem>
  <ElFormItem
    prop="config.dataStructure"
    :rules="[
      { required: true, message: 'Redis 数据结构不能为空', trigger: 'change' },
    ]"
    label="数据结构"
  >
    <ElSelect
      v-model="config.dataStructure"
      placeholder="请选择 Redis 数据结构"
      class="w-full"
    >
      <ElOption
        v-for="item in REDIS_DATA_STRUCTURE_OPTIONS"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </ElSelect>
  </ElFormItem>
  <ElFormItem
    v-if="isHash"
    prop="config.hashField"
    label="Hash 字段"
  >
    <ElInput
      v-model="config.hashField"
      placeholder="留空使用 deviceId 作为 Hash 字段"
    />
  </ElFormItem>
  <ElFormItem
    v-if="isZSet"
    prop="config.scoreField"
    label="Score 字段"
  >
    <ElInput
      v-model="config.scoreField"
      placeholder="留空使用当前时间戳作为 Score"
    />
  </ElFormItem>
</template>
