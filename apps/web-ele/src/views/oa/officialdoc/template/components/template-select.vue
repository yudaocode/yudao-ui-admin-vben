<script lang="ts" setup>
import type { OaOfficialDocTemplateApi } from '#/api/oa/officialdoc/template';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getSimpleOfficialDocTemplateList } from '#/api/oa/officialdoc/template';

defineOptions({ name: 'OaOfficialDocTemplateSelect' });

withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    filterable: true,
    modelValue: undefined,
    placeholder: '请选择套红模板',
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
  <ElSelect
    :model-value="modelValue"
    :disabled="disabled"
    :clearable="clearable"
    :filterable="filterable"
    :loading="loading"
    :placeholder="placeholder"
    @update:model-value="handleChange"
  >
    <ElOption
      v-for="template in templates"
      :key="template.id"
      :value="template.id!"
      :label="template.name"
    />
  </ElSelect>
</template>
