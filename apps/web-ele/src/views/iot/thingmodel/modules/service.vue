<!-- 产品的物模型表单（service 项） -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import { watch } from 'vue';

import {
  IoTThingModelParamDirectionEnum,
  IoTThingModelServiceCallTypeEnum,
} from '@vben/constants';
import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElRadio, ElRadioGroup } from 'element-plus';

import { ThingModelFormRules } from '#/api/iot/thingmodel';

import ThingModelInputOutputParam from './input-output-param.vue';

const props = defineProps<{ modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
const service = useVModel(props, 'modelValue', emits) as Ref<any>;

/** 默认选中，ASYNC 异步 */
watch(
  () => service.value.callType,
  (val: string | undefined) =>
    isEmpty(val) &&
    (service.value.callType = IoTThingModelServiceCallTypeEnum.ASYNC.value),
  { immediate: true },
);

/** 提取参数标识符列表，用于输入 / 输出参数跨表去重 */
function getParamIdentifiers(params?: any[]) {
  const identifiers: string[] = [];
  for (const item of params || []) {
    if (item.identifier) {
      identifiers.push(item.identifier);
    }
  }
  return identifiers;
}
</script>

<template>
  <ElFormItem
    :rules="ThingModelFormRules.callType"
    label="调用方式"
    prop="service.callType"
  >
    <ElRadioGroup v-model="service.callType">
      <ElRadio
        v-for="callType in Object.values(IoTThingModelServiceCallTypeEnum)"
        :key="callType.value"
        :value="callType.value"
      >
        {{ callType.label }}
      </ElRadio>
    </ElRadioGroup>
  </ElFormItem>
  <ElFormItem label="输入参数">
    <ThingModelInputOutputParam
      v-model="service.inputParams"
      :direction="IoTThingModelParamDirectionEnum.INPUT"
      :existing-identifiers="getParamIdentifiers(service.outputParams)"
    />
  </ElFormItem>
  <ElFormItem label="输出参数">
    <ThingModelInputOutputParam
      v-model="service.outputParams"
      :direction="IoTThingModelParamDirectionEnum.OUTPUT"
      :existing-identifiers="getParamIdentifiers(service.inputParams)"
    />
  </ElFormItem>
</template>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
