<script lang="ts" setup>
import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getToolTypeSimpleList } from '#/api/mes/tm/tool/type';

withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  { clearable: true, disabled: false, modelValue: undefined, placeholder: '请选择工具类型' },
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
function handleChange(value: number | string | undefined) {
  const toolTypeId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', toolTypeId);
  emit('change', list.value.find((item) => item.id === toolTypeId));
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
