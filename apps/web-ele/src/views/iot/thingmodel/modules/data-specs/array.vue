<!-- dataType：array 数组类型 -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import { getDataTypeOptions, IoTDataSpecsDataTypeEnum } from '@vben/constants';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput, ElRadio, ElRadioGroup } from 'element-plus';

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
function handleChange(val: any) {
  dataSpecs.value.dataSpecsList = [];
  dataSpecs.value.childDataType = val;
}
</script>

<template>
  <ElFormItem
    :rules="ThingModelFormRules.childDataType"
    label="元素类型"
    prop="property.dataSpecs.childDataType"
  >
    <ElRadioGroup v-model="dataSpecs.childDataType" @change="handleChange">
      <ElRadio
        v-for="item in childDataTypeOptions"
        :key="item.value"
        :value="item.value"
        class="w-1/3"
      >
        {{ `${item.value}(${item.label})` }}
      </ElRadio>
    </ElRadioGroup>
  </ElFormItem>
  <ElFormItem
    :rules="ThingModelFormRules.size"
    label="元素个数"
    prop="property.dataSpecs.size"
  >
    <ElInput v-model="dataSpecs.size" placeholder="请输入数组中的元素个数" />
  </ElFormItem>
  <!-- Struct 型配置-->
  <ThingModelStructDataSpecs
    v-if="dataSpecs.childDataType === IoTDataSpecsDataTypeEnum.STRUCT"
    v-model="dataSpecs.dataSpecsList"
    field-path="property.dataSpecs.dataSpecsList"
  />
</template>
