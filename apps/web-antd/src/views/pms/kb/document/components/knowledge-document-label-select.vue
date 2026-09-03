<script lang="ts" setup>
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getKnowledgeDocumentLabelList } from '#/api/pms/kb/content/document/label';

defineOptions({ name: 'PmsKnowledgeDocumentLabelSelect' });

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
  <Select
    :allow-clear="true"
    :loading="loading"
    :options="
      labelList.map((label) => ({ label: label.name, value: label.id }))
    "
    :value="modelValue"
    class="w-full"
    max-tag-count="responsive"
    mode="multiple"
    placeholder="请选择标签"
    @update:value="(value: any) => emit('update:modelValue', value)"
  />
</template>
