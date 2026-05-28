<!-- dataType：number 数组类型 -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import type { ThingModelApi } from '#/api/iot/thingmodel';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { useVModel } from '@vueuse/core';
import { ElFormItem, ElInput, ElOption, ElSelect } from 'element-plus';

const props = defineProps<{ modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
const dataSpecs = useVModel(
  props,
  'modelValue',
  emits,
) as Ref<ThingModelApi.DataSpecsNumberData>;

/** 单位下拉变化时，拆出 unitName 与 unit 回写 */
function unitChange(unitSpecs: any) {
  if (!unitSpecs) {
    return;
  }
  const [unitName, unit] = String(unitSpecs).split('-');
  dataSpecs.value.unitName = unitName;
  dataSpecs.value.unit = unit;
}

/** 校验最小值 */
function validateMin(_rule: any, _value: any, callback: any) {
  const min = Number(dataSpecs.value.min);
  const max = Number(dataSpecs.value.max);
  if (Number.isNaN(min)) {
    callback(new Error('请输入有效的数值'));
    return;
  }
  if (!Number.isNaN(max) && min >= max) {
    callback(new Error('最小值必须小于最大值'));
    return;
  }
  callback();
}

/** 校验最大值 */
function validateMax(_rule: any, _value: any, callback: any) {
  const min = Number(dataSpecs.value.min);
  const max = Number(dataSpecs.value.max);
  if (Number.isNaN(max)) {
    callback(new Error('请输入有效的数值'));
    return;
  }
  if (!Number.isNaN(min) && max <= min) {
    callback(new Error('最大值必须大于最小值'));
    return;
  }
  callback();
}

/** 校验步长 */
function validateStep(_rule: any, _value: any, callback: any) {
  const step = Number(dataSpecs.value.step);
  if (Number.isNaN(step)) {
    callback(new Error('请输入有效的数值'));
    return;
  }
  if (step <= 0) {
    callback(new Error('步长必须大于 0'));
    return;
  }
  const min = Number(dataSpecs.value.min);
  const max = Number(dataSpecs.value.max);
  if (!Number.isNaN(min) && !Number.isNaN(max) && step > max - min) {
    callback(new Error('步长不能大于最大值与最小值的差值'));
    return;
  }
  callback();
}
</script>

<template>
  <ElFormItem label="取值范围">
    <div class="flex items-center justify-between">
      <ElFormItem
        :rules="[
          { required: true, message: '最小值不能为空' },
          { validator: validateMin, trigger: 'blur' },
        ]"
        class="mb-0 flex-1"
        prop="property.dataSpecs.min"
      >
        <ElInput v-model="dataSpecs.min" placeholder="请输入最小值" />
      </ElFormItem>
      <span class="mx-2">~</span>
      <ElFormItem
        :rules="[
          { required: true, message: '最大值不能为空' },
          { validator: validateMax, trigger: 'blur' },
        ]"
        class="mb-0 flex-1"
        prop="property.dataSpecs.max"
      >
        <ElInput v-model="dataSpecs.max" placeholder="请输入最大值" />
      </ElFormItem>
    </div>
  </ElFormItem>
  <ElFormItem
    :rules="[
      { required: true, message: '步长不能为空' },
      { validator: validateStep, trigger: 'blur' },
    ]"
    label="步长"
    prop="property.dataSpecs.step"
  >
    <ElInput v-model="dataSpecs.step" placeholder="请输入步长" />
  </ElFormItem>
  <ElFormItem
    :rules="[{ required: true, message: '请选择单位' }]"
    label="单位"
    prop="property.dataSpecs.unit"
  >
    <ElSelect
      :model-value="
        dataSpecs.unit ? `${dataSpecs.unitName}-${dataSpecs.unit}` : ''
      "
      class="w-full"
      filterable
      placeholder="请选择单位"
      @change="unitChange"
    >
      <ElOption
        v-for="(item, index) in getDictOptions(
          DICT_TYPE.IOT_THING_MODEL_UNIT,
          'string',
        )"
        :key="index"
        :label="`${item.label}-${item.value}`"
        :value="`${item.label}-${item.value}`"
      />
    </ElSelect>
  </ElFormItem>
</template>

<style lang="scss" scoped>
:deep(.el-form-item) {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>
