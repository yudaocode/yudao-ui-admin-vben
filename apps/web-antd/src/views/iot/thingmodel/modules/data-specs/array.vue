<!-- dataType：array 数组类型 -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import { getDataTypeOptions, IoTDataSpecsDataTypeEnum } from '@vben/constants';

import { useVModel } from '@vueuse/core';
import { Form, Input, Radio } from 'ant-design-vue';

import { ThingModelFormRules } from '#/api/iot/thingmodel';

import ThingModelStructDataSpecs from './struct.vue';

const props = defineProps<{ modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
/** 数组元素禁止选择的类型 */
const EXCLUDED_CHILD_TYPES = new Set<string>([
  IoTDataSpecsDataTypeEnum.ARRAY,
  IoTDataSpecsDataTypeEnum.DATE,
  IoTDataSpecsDataTypeEnum.ENUM,
]);
const childDataTypeOptions = getDataTypeOptions().filter(
  (item) => !EXCLUDED_CHILD_TYPES.has(item.value),
);

const dataSpecs = useVModel(props, 'modelValue', emits) as Ref<any>;

/** 元素类型切换时，清理旧子类型的结构体属性配置 */
function handleChange(e: any) {
  const val = e?.target?.value ?? e;
  dataSpecs.value.dataSpecsList = [];
  dataSpecs.value.childDataType = val;
}
</script>

<template>
  <Form.Item
    :name="['property', 'dataSpecs', 'childDataType']"
    :rules="ThingModelFormRules.childDataType"
    label="元素类型"
  >
    <Radio.Group v-model:value="dataSpecs.childDataType" @change="handleChange">
      <Radio
        v-for="item in childDataTypeOptions"
        :key="item.value"
        :value="item.value"
        class="w-1/3"
      >
        {{ `${item.value}(${item.label})` }}
      </Radio>
    </Radio.Group>
  </Form.Item>
  <Form.Item
    :name="['property', 'dataSpecs', 'size']"
    :rules="ThingModelFormRules.size"
    label="元素个数"
  >
    <Input
      v-model:value="dataSpecs.size"
      placeholder="请输入数组中的元素个数"
    />
  </Form.Item>
  <!-- Struct 型配置-->
  <ThingModelStructDataSpecs
    v-if="dataSpecs.childDataType === IoTDataSpecsDataTypeEnum.STRUCT"
    v-model="dataSpecs.dataSpecsList"
    :field-path="['property', 'dataSpecs', 'dataSpecsList']"
  />
</template>
