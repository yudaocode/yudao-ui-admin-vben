<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MesDvSubjectApi } from '#/api/mes/dv/subject';

import { computed, onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getSubjectSimpleList } from '#/api/mes/dv/subject';

defineOptions({ name: 'DvSubjectSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    type?: number;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择项目',
    type: undefined,
  },
);
const emit = defineEmits<{
  change: [row?: MesDvSubjectApi.Subject];
  'update:modelValue': [value?: number];
}>();
const list = ref<MesDvSubjectApi.Subject[]>([]); // 项目列表
const filteredList = computed(
  () => list.value.filter((item) => !props.type || item.type === props.type),
);

/** 加载项目列表 */
async function getList() {
  list.value = await getSubjectSimpleList();
}

/** 处理选择变化 */
function handleChange(value: SelectValue) {
  const subjectId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', subjectId);
  emit('change', list.value.find((item) => item.id === subjectId));
}

onMounted(getList);
</script>

<template>
  <Select
    :allow-clear="allowClear"
    :disabled="disabled"
    :field-names="{ label: 'name', value: 'id' }"
    :options="filteredList"
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="name"
    show-search
    @change="handleChange"
  />
</template>
