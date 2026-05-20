<!-- 产品的物模型表单（event 项） -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import { watch } from 'vue';

import {
  IoTThingModelEventTypeEnum,
  IoTThingModelParamDirectionEnum,
} from '@vben/constants';
import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElRadio, ElRadioGroup } from 'element-plus';

import { ThingModelFormRules } from '#/api/iot/thingmodel';

import ThingModelInputOutputParam from './input-output-param.vue';

const props = defineProps<{ modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
const thingModelEvent = useVModel(props, 'modelValue', emits) as Ref<any>;

/** 默认选中，INFO 信息 */
watch(
  () => thingModelEvent.value.type,
  (val: string | undefined) =>
    isEmpty(val) &&
    (thingModelEvent.value.type = IoTThingModelEventTypeEnum.INFO.value),
  { immediate: true },
);
</script>

<template>
  <ElFormItem
    :rules="ThingModelFormRules.eventType"
    label="事件类型"
    prop="event.type"
  >
    <ElRadioGroup v-model="thingModelEvent.type">
      <ElRadio
        v-for="eventType in Object.values(IoTThingModelEventTypeEnum)"
        :key="eventType.value"
        :value="eventType.value"
      >
        {{ eventType.label }}
      </ElRadio>
    </ElRadioGroup>
  </ElFormItem>
  <ElFormItem label="输出参数">
    <ThingModelInputOutputParam
      v-model="thingModelEvent.outputParams"
      :direction="IoTThingModelParamDirectionEnum.OUTPUT"
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
