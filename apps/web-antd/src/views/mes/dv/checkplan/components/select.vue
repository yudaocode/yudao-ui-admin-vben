<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { onMounted, ref, watch } from 'vue';

import { Select } from 'ant-design-vue';

import { getCheckPlanPage } from '#/api/mes/dv/checkplan';

defineOptions({ name: 'DvCheckPlanSelect' });

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    status?: number;
    type?: number;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择计划',
    status: undefined,
    type: undefined,
  },
);
const emit = defineEmits<{
  change: [row?: MesDvCheckPlanApi.CheckPlan];
  'update:modelValue': [value?: number];
}>();
const list = ref<MesDvCheckPlanApi.CheckPlan[]>([]); // 点检计划列表

/** 加载点检计划列表 */
async function getList() {
  const data = await getCheckPlanPage({
    pageNo: 1,
    pageSize: 100,
    status: props.status,
    type: props.type,
  });
  list.value = data.list || [];
}

/** 处理点检计划选择变化 */
function handleChange(value: SelectValue) {
  const planId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', planId);
  emit('change', list.value.find((item) => item.id === planId));
}

watch(() => [props.status, props.type], getList);

onMounted(getList);
</script>

<template>
  <Select
    :allow-clear="allowClear"
    :disabled="disabled"
    :field-names="{ label: 'name', value: 'id' }"
    :options="list"
    :placeholder="placeholder"
    :value="modelValue"
    class="w-full"
    option-filter-prop="name"
    show-search
    @change="handleChange"
  />
</template>
