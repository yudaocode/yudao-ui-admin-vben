<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getRecruitEliminateReasonList } from '#/api/hrm/recruit/config';

defineOptions({ name: 'HrmRecruitEliminateReasonSelect' });

const props = withDefaults(
  defineProps<{
    allowCreate?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    filterable?: boolean;
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    allowCreate: true,
    clearable: true,
    disabled: false,
    filterable: true,
    modelValue: undefined,
    placeholder: '请选择或输入淘汰原因',
  },
);

const emit = defineEmits<{
  change: [value: string | undefined];
  'update:modelValue': [value: string | undefined];
}>();

const loading = ref(false);
const reasonList = ref<string[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

/** 选中变化 */
function handleChange(value: string | undefined) {
  emit('change', value);
}

/** 获得淘汰原因列表 */
async function getReasonList() {
  loading.value = true;
  try {
    reasonList.value = (await getRecruitEliminateReasonList()) || [];
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  getReasonList();
});
</script>

<template>
  <ElSelect
    v-model="selectValue"
    :allow-create="allowCreate"
    :clearable="clearable"
    :default-first-option="true"
    :disabled="disabled"
    :filterable="filterable"
    :loading="loading"
    :placeholder="placeholder"
    class="w-full"
    @change="handleChange"
  >
    <ElOption
      v-for="reason in reasonList"
      :key="reason"
      :label="reason"
      :value="reason"
    />
  </ElSelect>
</template>
