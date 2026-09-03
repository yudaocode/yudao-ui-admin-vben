<script lang="ts" setup>
import type { PmsWorkItemLabelApi } from '#/api/pms/pm/workitem/label';

import { onMounted, ref } from 'vue';

import { Select } from 'antdv-next';

import { getWorkItemLabelList } from '#/api/pms/pm/workitem/label';

defineOptions({ name: 'PmsWorkItemLabelSelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

withDefaults(
  defineProps<{
    modelValue?: number[];
    placeholder?: string;
  }>(),
  { modelValue: undefined, placeholder: '请选择标签' },
);

const emit = defineEmits(['update:modelValue']);

const loading = ref(false); // 选项加载中
const labelList = ref<PmsWorkItemLabelApi.WorkItemLabel[]>([]); // 工作项标签选项

/** 查询工作项标签选项 */
async function getLabelList() {
  loading.value = true;
  try {
    labelList.value = await getWorkItemLabelList();
  } finally {
    loading.value = false;
  }
}

defineExpose({ getLabelList }); // 提供 getLabelList 方法，用于标签管理后刷新选项

onMounted(() => getLabelList());
</script>

<template>
  <Select
    :allow-clear="true"
    :loading="loading"
    :options="
      labelList
        .filter((label) => label.id !== undefined)
        .map((label) => ({ label: label.name, value: label.id! }))
    "
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    max-tag-count="responsive"
    mode="multiple"
    option-filter-prop="label"
    show-search
    @update:value="emit('update:modelValue', $event)"
  />
</template>
