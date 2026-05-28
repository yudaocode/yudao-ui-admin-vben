<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MesTmToolApi } from '#/api/mes/tm/tool';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getToolSimpleList } from '#/api/mes/tm/tool';

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  { allowClear: true, disabled: false, modelValue: undefined, placeholder: '请选择工具' },
);
const emit = defineEmits<{
  change: [row?: MesTmToolApi.Tool];
  'update:modelValue': [value?: number];
}>();
const list = ref<MesTmToolApi.Tool[]>([]); // 工具列表

/** 加载工具列表 */
async function getList() {
  list.value = await getToolSimpleList();
}

/** 处理工具选择变化 */
function handleChange(value: SelectValue) {
  const toolId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', toolId);
  emit('change', list.value.find((item) => item.id === toolId));
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
