<script lang="ts" setup>
import type { MesTmToolApi } from '#/api/mes/tm/tool';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getToolSimpleList } from '#/api/mes/tm/tool';

withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  { clearable: true, disabled: false, modelValue: undefined, placeholder: '请选择工具' },
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
function handleChange(value: number | string | undefined) {
  const toolId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', toolId);
  emit(
    'change',
    list.value.find((item) => item.id === toolId),
  );
}

onMounted(getList);
</script>

<template>
  <ElSelect
    :clearable="clearable"
    :disabled="disabled"
    :model-value="modelValue"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption v-for="item in list" :key="item.id" :label="item.name" :value="item.id!" />
  </ElSelect>
</template>
