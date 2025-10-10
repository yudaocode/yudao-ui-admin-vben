<!-- 产品的物模型表单（service 项） -->
<script lang="ts" setup>
import { isEmpty } from '@vben/utils';

import { useVModel } from '@vueuse/core';

import { ThingModelService } from '#/api/iot/thingmodel';
import {
  IoTThingModelParamDirectionEnum,
  IoTThingModelServiceCallTypeEnum,
} from '#/views/iot/utils/constants';

import ThingModelInputOutputParam from './ThingModelInputOutputParam.vue';

/** IoT 物模型服务 */
defineOptions({ name: 'ThingModelService' });

const props = defineProps<{ isStructDataSpecs?: boolean; modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
const service = useVModel(props, 'modelValue', emits) as Ref<ThingModelService>;

/** 默认选中，ASYNC 异步 */
watch(
  () => service.value.callType,
  (val: string) =>
    isEmpty(val) &&
    (service.value.callType = IoTThingModelServiceCallTypeEnum.ASYNC.value),
  { immediate: true },
);
</script>

<template>
  <el-form-item
    :rules="[{ required: true, message: '请选择调用方式', trigger: 'change' }]"
    label="调用方式"
    prop="service.callType"
  >
    <el-radio-group v-model="service.callType">
      <el-radio
        v-for="callType in Object.values(IoTThingModelServiceCallTypeEnum)"
        :key="callType.value"
        :value="callType.value"
      >
        {{ callType.label }}
      </el-radio>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="输入参数">
    <ThingModelInputOutputParam
      v-model="service.inputParams"
      :direction="IoTThingModelParamDirectionEnum.INPUT"
    />
  </el-form-item>
  <el-form-item label="输出参数">
    <ThingModelInputOutputParam
      v-model="service.outputParams"
      :direction="IoTThingModelParamDirectionEnum.OUTPUT"
    />
  </el-form-item>
</template>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
