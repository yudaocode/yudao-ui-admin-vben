<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getToolTypeSimpleList } from '#/api/mes/tm/tool/type';

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  { allowClear: true, disabled: false, modelValue: undefined, placeholder: '请选择工具类型' },
);
const emit = defineEmits<{
  change: [row?: MesTmToolTypeApi.ToolType];
  'update:modelValue': [value?: number];
}>();
const list = ref<MesTmToolTypeApi.ToolType[]>([]); // 工具类型列表

/** 加载工具类型列表 */
async function getList() {
  list.value = await getToolTypeSimpleList();
}

/** 处理工具类型选择变化 */
function handleChange(value: SelectValue) {
  const toolTypeId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', toolTypeId);
  emit('change', list.value.find((item) => item.id === toolTypeId));
}

onMounted(getList);
</script>

<template>
  <Select
    :allow-clear="allowClear"
    :disabled="disabled"
    :field-names="{ label: 'name', value: 'id' }"
    :options="list"
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="name"
    show-search
    @change="handleChange"
  />
</template>
