<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { AutoComplete } from 'antdv-next';

import { getRecruitEliminateReasonList } from '#/api/hrm/recruit/config';

defineOptions({ name: 'HrmRecruitEliminateReasonSelect' });

const props = withDefaults(
  defineProps<{
    allowCreate?: boolean;
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: string;
    placeholder?: string;
  }>(),
  {
    allowCreate: true,
    clearable: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择或输入淘汰原因',
  },
);

const emit = defineEmits<{
  change: [value: string | undefined];
  'update:modelValue': [value: string | undefined];
}>();

const reasonList = ref<string[]>([]);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const options = computed(() => {
  const list = reasonList.value.map((reason) => ({
    value: reason,
    label: reason,
  }));
  if (
    props.allowCreate ||
    !props.modelValue ||
    list.some((item) => item.value === props.modelValue)
  ) {
    return list;
  }
  return [{ value: props.modelValue, label: props.modelValue }, ...list];
});

/** 选中变化 */
function handleChange(value: string) {
  emit('change', value || undefined);
}

/** 获得淘汰原因列表 */
async function getReasonList() {
  reasonList.value = (await getRecruitEliminateReasonList()) || [];
}

onMounted(() => {
  getReasonList();
});
</script>

<template>
  <AutoComplete
    v-model:value="selectValue"
    :allow-clear="clearable"
    :disabled="disabled"
    :options="options"
    :placeholder="placeholder"
    class="w-full"
    @change="handleChange"
  />
</template>
