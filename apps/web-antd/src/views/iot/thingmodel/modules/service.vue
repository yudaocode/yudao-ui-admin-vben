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
import { Form, Radio } from 'ant-design-vue';

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
  <Form.Item
    :name="['service', 'callType']"
    :rules="ThingModelFormRules.callType"
    label="调用方式"
  >
    <Radio.Group v-model:value="service.callType">
      <Radio
        v-for="callType in Object.values(IoTThingModelServiceCallTypeEnum)"
        :key="callType.value"
        :value="callType.value"
      >
        {{ callType.label }}
      </Radio>
    </Radio.Group>
  </Form.Item>
  <Form.Item label="输入参数">
    <ThingModelInputOutputParam
      v-model="service.inputParams"
      :direction="IoTThingModelParamDirectionEnum.INPUT"
      :existing-identifiers="getParamIdentifiers(service.outputParams)"
    />
  </Form.Item>
  <Form.Item label="输出参数">
    <ThingModelInputOutputParam
      v-model="service.outputParams"
      :direction="IoTThingModelParamDirectionEnum.OUTPUT"
      :existing-identifiers="getParamIdentifiers(service.inputParams)"
    />
  </Form.Item>
</template>

<style lang="scss" scoped>
:deep(.ant-form-item) {
  .ant-form-item {
    margin-bottom: 0;
  }
}
</style>
