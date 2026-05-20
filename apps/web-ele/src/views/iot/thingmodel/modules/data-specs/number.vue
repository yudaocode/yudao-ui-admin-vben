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
</script>

<template>
  <ElFormItem label="取值范围">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <ElInput v-model="dataSpecs.min" placeholder="请输入最小值" />
      </div>
      <span class="mx-2">~</span>
      <div class="flex-1">
        <ElInput v-model="dataSpecs.max" placeholder="请输入最大值" />
      </div>
    </div>
  </ElFormItem>
  <ElFormItem label="步长">
    <ElInput v-model="dataSpecs.step" placeholder="请输入步长" />
  </ElFormItem>
  <ElFormItem label="单位">
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
