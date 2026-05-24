<!-- dataType：number 数组类型 -->
<script lang="ts" setup>
import type { Ref } from 'vue';

import type { ThingModelApi } from '#/api/iot/thingmodel';

import { computed } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import { useVModel } from '@vueuse/core';
import { Form, Input, Select } from 'ant-design-vue';

const props = defineProps<{ modelValue: any }>();
const emits = defineEmits(['update:modelValue']);
const dataSpecs = useVModel(
  props,
  'modelValue',
  emits,
) as Ref<ThingModelApi.DataSpecsNumberData>;

/** 单位字典选项 */
const unitOptions = computed(() =>
  getDictOptions(DICT_TYPE.IOT_THING_MODEL_UNIT, 'string'),
);

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
  <Form.Item label="取值范围">
    <div class="flex items-center justify-between">
      <Form.Item
        :name="['property', 'dataSpecs', 'min']"
        :rules="[
          { required: true, message: '最小值不能为空', trigger: 'blur' },
          { validator: validateMin, trigger: 'blur' },
        ]"
        class="mb-0 flex-1"
      >
        <Input v-model:value="dataSpecs.min" placeholder="请输入最小值" />
      </Form.Item>
      <span class="mx-2">~</span>
      <Form.Item
        :name="['property', 'dataSpecs', 'max']"
        :rules="[
          { required: true, message: '最大值不能为空', trigger: 'blur' },
          { validator: validateMax, trigger: 'blur' },
        ]"
        class="mb-0 flex-1"
      >
        <Input v-model:value="dataSpecs.max" placeholder="请输入最大值" />
      </Form.Item>
    </div>
  </Form.Item>
  <Form.Item
    :name="['property', 'dataSpecs', 'step']"
    :rules="[
      { required: true, message: '步长不能为空', trigger: 'blur' },
      { validator: validateStep, trigger: 'blur' },
    ]"
    label="步长"
  >
    <Input v-model:value="dataSpecs.step" placeholder="请输入步长" />
  </Form.Item>
  <Form.Item
    :name="['property', 'dataSpecs', 'unit']"
    :rules="[{ required: true, message: '请选择单位', trigger: 'change' }]"
    label="单位"
  >
    <Select
      :value="dataSpecs.unit ? `${dataSpecs.unitName}-${dataSpecs.unit}` : ''"
      show-search
      placeholder="请选择单位"
      class="w-full"
      @change="unitChange"
    >
      <Select.Option
        v-for="(item, index) in unitOptions"
        :key="index"
        :value="`${item.label}-${item.value}`"
      >
        {{ `${item.label}-${item.value}` }}
      </Select.Option>
    </Select>
  </Form.Item>
</template>

<style lang="scss" scoped>
:deep(.ant-form-item) {
  .ant-form-item {
    margin-bottom: 0;
  }
}
</style>
