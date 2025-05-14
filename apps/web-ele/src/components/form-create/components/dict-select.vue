<!-- 数据字典 Select 选择器 -->
<script lang="ts" setup>
import type { DictSelectProps } from '../typing';

import { computed, useAttrs } from 'vue';

import {
  ElCheckbox,
  ElCheckboxGroup,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

import { getDictObj, getIntDictOptions, getStrDictOptions } from '#/utils';

defineOptions({ name: 'DictSelect' });

const props = withDefaults(defineProps<DictSelectProps>(), {
  valueType: 'str',
  selectType: 'select',
});

const attrs = useAttrs();

// 获得字典配置
// TODO @dhb：可以使用 getDictOptions 替代么？
const getDictOptions = computed(() => {
  switch (props.valueType) {
    case 'bool': {
      return getDictObj(props.dictType, 'bool');
    }
    case 'int': {
      return getIntDictOptions(props.dictType);
    }
    case 'str': {
      return getStrDictOptions(props.dictType);
    }
    default: {
      return [];
    }
  }
});
</script>

<template>
  <ElSelect v-if="selectType === 'select'" class="w-1/1" v-bind="attrs">
    <ElOption
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :value="dict.value"
      :label="dict.label"
    />
  </ElSelect>
  <ElRadioGroup v-if="selectType === 'radio'" class="w-1/1" v-bind="attrs">
    <ElRadio
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :label="dict.value"
    >
      {{ dict.label }}
    </ElRadio>
  </ElRadioGroup>
  <ElCheckboxGroup
    v-if="selectType === 'checkbox'"
    class="w-1/1"
    v-bind="attrs"
  >
    <ElCheckbox
      v-for="(dict, index) in getDictOptions"
      :key="index"
      :label="dict.value"
    >
      {{ dict.label }}
    </ElCheckbox>
  </ElCheckboxGroup>
</template>
