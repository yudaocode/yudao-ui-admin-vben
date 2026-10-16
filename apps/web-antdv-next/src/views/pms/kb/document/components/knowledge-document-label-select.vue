<script lang="ts" setup>
import type { PmsKnowledgeDocumentLabelApi } from '#/api/pms/kb/content/document/label';

import { onMounted, ref } from 'vue';

import { Select } from 'antdv-next';

import { getKnowledgeDocumentLabelList } from '#/api/pms/kb/content/document/label';

defineOptions({ name: 'PmsKnowledgeDocumentLabelSelect' });

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number[];
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: () => [],
    placeholder: '请选择标签',
  },
);

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
    :allow-clear="allowClear"
    :disabled="disabled"
    :loading="loading"
    :options="
      labelList.map((label) => ({ label: label.name, value: label.id }))
    "
    :value="modelValue"
    class="w-full"
    max-tag-count="responsive"
    mode="multiple"
    :placeholder="placeholder"
    @update:value="(value: any) => emit('update:modelValue', value)"
  />
</template>
