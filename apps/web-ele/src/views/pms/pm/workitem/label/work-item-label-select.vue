<script lang="ts" setup>
import type { PmsWorkItemLabelApi } from '#/api/pms/pm/workitem/label';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getWorkItemLabelList } from '#/api/pms/pm/workitem/label';

defineOptions({ name: 'PmsWorkItemLabelSelect' });

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
  <ElSelect
    :model-value="modelValue"
    :loading="loading"
    :placeholder="placeholder"
    class="w-full"
    clearable
    collapse-tags
    filterable
    multiple
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="label in labelList"
      :key="label.id"
      :label="label.name"
      :value="label.id!"
    />
  </ElSelect>
</template>
