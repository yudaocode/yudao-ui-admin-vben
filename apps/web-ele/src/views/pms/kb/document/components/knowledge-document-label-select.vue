<script lang="ts" setup>
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getKnowledgeDocumentLabelList } from '#/api/pms/kb/content/document/label';

defineOptions({ name: 'PmsKnowledgeDocumentLabelSelect' });

// TODO @AI：对齐 system/user/components/select.vue：modelValue、禁用、清空、回显；三端 props 和清空行为保持一致。

defineProps<{
  modelValue: number[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number[]];
}>();

const loading = ref(false);
const labelList = ref<PmsKnowledgeDocumentLabelApi.KnowledgeDocumentLabel[]>(
  [],
);

onMounted(async () => {
  loading.value = true;
  try {
    labelList.value = await getKnowledgeDocumentLabelList();
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <ElSelect
    :model-value="modelValue"
    :loading="loading"
    class="w-full"
    clearable
    multiple
    placeholder="请选择标签"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ElOption
      v-for="label in labelList"
      :key="label.id"
      :label="label.name"
      :value="label.id"
    />
  </ElSelect>
</template>
