<!-- 产品的物模型表单（event 项） -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import { watch } from 'vue';

import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';
import { Radio } from 'antdv-next';

import {
  IoTThingModelEventTypeEnum,
  IoTThingModelParamDirectionEnum,
} from '#/views/iot/utils/constants';

import ThingModelInputOutputParam from './thing-model-input-output-param.vue';

/** IoT 物模型事件 */
defineOptions({ name: 'ThingModelEvent' });

const props = defineProps<{ isStructDataSpecs?: boolean; modelValue: any }>();
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
  <FormItem
    :name="['event', 'type']"
    :rules="[{ required: true, message: '请选择事件类型', trigger: 'change' }]"
    label="事件类型"
  >
    <RadioGroup v-model:value="thingModelEvent.type">
      <Radio
        v-for="eventType in Object.values(IoTThingModelEventTypeEnum)"
        :key="eventType.value"
        :value="eventType.value"
      >
        {{ eventType.label }}
      </Radio>
    </RadioGroup>
  </FormItem>
  <FormItem label="输出参数">
    <ThingModelInputOutputParam
      v-model="thingModelEvent.outputParams"
      :direction="IoTThingModelParamDirectionEnum.OUTPUT"
    />
  </FormItem>
</template>

<style lang="scss" scoped>
:deep(.ant-form-item) {
  .ant-form-item {
    margin-bottom: 0;
  }
}
</style>
