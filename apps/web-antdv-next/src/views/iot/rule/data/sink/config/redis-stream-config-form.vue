<script lang="ts" setup>
import { onMounted } from 'vue';

import {
  IOT_REDIS_DATA_STRUCTURE_OPTIONS,
  IotRedisDataStructureEnum,
} from '@vben/constants';
import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import {
  FormItem,
  Input,
  InputNumber,
  InputPassword,
  Select,
} from 'antdv-next';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

onMounted(() => {
  if (!isEmpty(config.value)) {
    config.value.dataStructure ??= IotRedisDataStructureEnum.STREAM;
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.REDIS_STREAM}`,
    host: '',
    port: 6379,
    password: '',
    database: 0,
    dataStructure: IotRedisDataStructureEnum.STREAM,
    topic: '',
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
    :name="['config', 'password']"
    :rules="[{ required: true, message: '密码不能为空', trigger: 'blur' }]"
    label="密码"
  >
    <InputPassword v-model:value="config.password" placeholder="请输入密码" />
  </FormItem>
  <FormItem
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
  </FormItem>
  <FormItem
    :name="['config', 'topic']"
    :rules="[{ required: true, message: '主题不能为空', trigger: 'blur' }]"
    label="主题"
  >
    <Input v-model:value="config.topic" placeholder="请输入主题" />
  </FormItem>
  <FormItem
    :name="['config', 'dataStructure']"
    label="数据结构"
    :rules="[{ required: true, message: '请选择数据结构', trigger: 'change' }]"
  >
    <Select
      v-model:value="config.dataStructure"
      :options="IOT_REDIS_DATA_STRUCTURE_OPTIONS"
      placeholder="请选择数据结构"
      class="w-full"
    />
  </FormItem>
  <FormItem
    v-if="config.dataStructure === IotRedisDataStructureEnum.HASH"
    :name="['config', 'hashField']"
    label="Hash 字段"
  >
    <Input v-model:value="config.hashField" placeholder="留空时使用设备 ID" />
  </FormItem>
  <FormItem
    v-if="config.dataStructure === IotRedisDataStructureEnum.ZSET"
    :name="['config', 'scoreField']"
    label="分数字段"
  >
    <Input v-model:value="config.scoreField" placeholder="留空时使用当前时间" />
  </FormItem>
</template>
