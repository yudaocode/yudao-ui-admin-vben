<script lang="ts" setup>
import type { SystemSmsTemplateApi } from '#/api/system/sms/template';

import { computed, onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getSimpleSmsTemplateList } from '#/api/system/sms/template';

defineOptions({ name: 'SmsTemplateSelect', inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择短信模板',
  },
);

const emit = defineEmits<{
  change: [template: SystemSmsTemplateApi.SmsTemplateSimple | undefined];
  'update:modelValue': [value: string | undefined];
}>();

const loading = ref(false);
const templateList = ref<SystemSmsTemplateApi.SmsTemplateSimple[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: string | undefined) => {
    emit('update:modelValue', value || undefined);
  },
});

/** 选中变化 */
function handleChange(value: string | undefined) {
  emit(
    'change',
    templateList.value.find((template) => template.code === value),
  );
}

/** 查询短信模板精简列表 */
async function getList() {
  try {
    loading.value = true;
    templateList.value = await getSimpleSmsTemplateList();
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getList();
});
</script>

<template>
  <ElSelect
    v-bind="$attrs"
    v-model="selectValue"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption
      v-for="template in templateList"
      :key="template.id"
      :label="`${template.name}（${template.code}）`"
      :value="template.code"
    />
  </ElSelect>
</template>
