<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { MesQcResultValueType } from '@vben/constants';

import { ElOption, ElRadioButton, ElRadioGroup, ElSelect } from 'element-plus';

import { getSimpleDictTypeList } from '#/api/system/dict/type';

defineOptions({ name: 'QcIndicatorResultSpecificationInput' });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    resultType?: number;
  }>(),
  {
    modelValue: undefined,
    resultType: undefined,
  },
);
const emit = defineEmits<{
  'update:modelValue': [value?: string];
}>();

const fileOptions = [
  { label: '图片/照片', value: 'IMG' },
  { label: '文件', value: 'FILE' },
];
const dictTypeOptions = ref<{ name?: string; type?: string }[]>([]);

const innerValue = computed({
  get: () => props.modelValue,
  set: (value?: string) => emit('update:modelValue', value),
});

/** 加载字典类型选项（仅字典类型结果值需要） */
async function loadDictTypeOptions() {
  if (dictTypeOptions.value.length > 0) {
    return;
  }
  dictTypeOptions.value = await getSimpleDictTypeList();
}

watch(
  () => props.resultType,
  (value) => {
    if (value === MesQcResultValueType.DICT) {
      void loadDictTypeOptions();
    }
  },
  { immediate: true },
);
</script>

<template>
  <ElRadioGroup
    v-if="resultType === MesQcResultValueType.FILE"
    v-model="innerValue"
  >
    <ElRadioButton
      v-for="option in fileOptions"
      :key="option.value"
      :value="option.value"
    >
      {{ option.label }}
    </ElRadioButton>
  </ElRadioGroup>
  <ElSelect
    v-else-if="resultType === MesQcResultValueType.DICT"
    v-model="innerValue"
    class="!w-full"
    clearable
    filterable
    placeholder="请选择字典类型"
  >
    <ElOption
      v-for="item in dictTypeOptions"
      :key="item.type"
      :label="item.name"
      :value="item.type!"
    />
  </ElSelect>
</template>
