<!-- 数据字典 Select 选择器 -->
<script lang="ts" setup>
import type { DictSelectProps } from '../typing';

import { computed, ref, useAttrs, watch } from 'vue';

import { getDictOptions } from '@vben/hooks';

import {
  ElCheckbox,
  ElCheckboxGroup,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
} from 'element-plus';

defineOptions({ name: 'DictSelect' });

const props = withDefaults(defineProps<DictSelectProps>(), {
  valueType: 'str',
  selectType: 'select',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
}>();

const attrs = useAttrs();

/** 内部选中值 */
const selectedValue = ref<any>();

/** 同步 modelValue 到内部选中值 */
watch(
  () => props.modelValue,
  (newVal) => {
    selectedValue.value = newVal;
  },
  { immediate: true },
);

/** 获得字典配置 */
const getDictOption = computed(() => {
  switch (props.valueType) {
    case 'bool': {
      return getDictOptions(props.dictType, 'boolean');
    }
    case 'int': {
      return getDictOptions(props.dictType, 'number');
    }
    case 'str': {
      return getDictOptions(props.dictType, 'string');
    }
    default: {
      return [];
    }
  }
});

function handleChange(value: any) {
  emit('update:modelValue', value);
}
</script>

<template>
  <ElSelect
    v-if="selectType === 'select'"
    v-model="selectedValue"
    class="w-full"
    v-bind="attrs"
    @change="handleChange"
  >
    <ElOption
      v-for="(dict, index) in getDictOption"
      :key="index"
      :value="dict.value"
      :label="dict.label"
    />
  </ElSelect>
  <ElRadioGroup
    v-if="selectType === 'radio'"
    v-model="selectedValue"
    class="w-full"
    v-bind="attrs"
    @change="handleChange"
  >
    <ElRadio
      v-for="(dict, index) in getDictOption"
      :key="index"
      :value="dict.value"
    >
      {{ dict.label }}
    </ElRadio>
  </ElRadioGroup>
  <ElCheckboxGroup
    v-if="selectType === 'checkbox'"
    v-model="selectedValue"
    class="w-full"
    v-bind="attrs"
    @change="handleChange"
  >
    <ElCheckbox
      v-for="(dict, index) in getDictOption"
      :key="index"
      :value="dict.value"
    >
      {{ dict.label }}
    </ElCheckbox>
  </ElCheckboxGroup>
</template>
