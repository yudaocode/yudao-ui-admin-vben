<script lang="ts" setup>
import { onMounted } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput, ElInputNumber } from 'element-plus';

import { IotDataSinkTypeEnum } from '#/api/iot/rule/data/sink';

const props = defineProps<{ modelValue: any }>();
const emit = defineEmits(['update:modelValue']);
const config = useVModel(props, 'modelValue', emit);

/** 移除当前 Redis Stream API 类型未声明的旧扩展字段 */
function removeUnsupportedFields() {
  delete config.value.dataStructure;
  delete config.value.hashField;
  delete config.value.scoreField;
}

onMounted(() => {
  if (!isEmpty(config.value)) {
    removeUnsupportedFields();
    return;
  }
  config.value = {
    type: `${IotDataSinkTypeEnum.REDIS_STREAM}`,
    host: '',
    port: 6379,
    password: '',
    database: 0,
    topic: '',
  };
});
</script>

<template>
  <ElFormItem
    prop="config.host"
    :rules="[{ required: true, message: '主机地址不能为空', trigger: 'blur' }]"
    label="主机地址"
  >
    <ElInput
      v-model="config.host"
      placeholder="请输入主机地址，如：localhost"
    />
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
</template>
