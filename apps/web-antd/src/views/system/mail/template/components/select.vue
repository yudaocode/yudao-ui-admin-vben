<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { SystemMailTemplateApi } from '#/api/system/mail/template';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getSimpleMailTemplateList } from '#/api/system/mail/template';

defineOptions({ name: 'MailTemplateSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择邮件模板',
  },
);

const emit = defineEmits<{
  change: [template: SystemMailTemplateApi.MailTemplateSimple | undefined];
  'update:modelValue': [value: string | undefined];
}>();

const loading = ref(false);
const templateList = ref<SystemMailTemplateApi.MailTemplateSimple[]>([]);
const options = computed(() =>
  templateList.value.map((template) => ({
    label: `${template.name}（${template.code}）`,
    value: template.code,
  })),
);

/** 选中变化 */
function handleChange(value: SelectValue) {
  const templateCode = typeof value === 'string' ? value : undefined;
  emit('update:modelValue', templateCode);
  emit(
    'change',
    templateList.value.find((template) => template.code === templateCode),
  );
}

/** 查询邮件模板精简列表 */
async function getList() {
  try {
    loading.value = true;
    templateList.value = await getSimpleMailTemplateList();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getList();
});
</script>

<template>
  <Select
    v-bind="$attrs"
    :allow-clear="allowClear"
    :disabled="disabled"
    :loading="loading"
    :options="options"
    :placeholder="placeholder"
    :value="props.modelValue"
    class="w-full"
    option-filter-prop="label"
    show-search
    @change="handleChange"
  />
</template>
