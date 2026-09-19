<script lang="ts" setup>
import type { OaOfficialDocTemplateApi } from '#/api/oa/officialdoc/template';

import { onMounted, ref } from 'vue';

import { Select } from 'antdv-next';

import { getSimpleOfficialDocTemplateList } from '#/api/oa/officialdoc/template';

defineOptions({ name: 'OaOfficialDocTemplateSelect' });

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    showSearch?: boolean;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择套红模板',
    showSearch: true,
  },
);

const emit = defineEmits<{
  change: [value: number | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const templates = ref<OaOfficialDocTemplateApi.OfficialDocTemplate[]>([]); // 套红模板列表
const loading = ref(false); // 列表的加载中

/** 选中变化 */
function handleChange(value: unknown) {
  const templateId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', templateId);
  emit('change', templateId);
}

/** 获得套红模板列表 */
async function getList() {
  loading.value = true;
  try {
    templates.value = await getSimpleOfficialDocTemplateList();
  } finally {
    loading.value = false;
  }
}

/** 初始化 */
onMounted(() => {
  getList();
});
</script>

<template>
  <Select
    :value="modelValue"
    :disabled="disabled"
    :allow-clear="allowClear"
    :show-search="showSearch"
    :loading="loading"
    :placeholder="placeholder"
    :options="
      templates.map((template) => ({ label: template.name, value: template.id }))
    "
    option-filter-prop="label"
    @update:value="handleChange"
  />
</template>
