<script lang="ts" setup>
import type { MesDvCheckPlanApi } from '#/api/mes/dv/checkplan';

import { onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getCheckPlanPage } from '#/api/mes/dv/checkplan';

defineOptions({ name: 'DvCheckPlanSelect' });

const props = withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
    status?: number;
    type?: number;
  }>(),
  {
    clearable: true,
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
function handleChange(value: number | string | undefined) {
  const planId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', planId);
  emit('change', list.value.find((item) => item.id === planId));
}

watch(() => [props.status, props.type], getList);

onMounted(getList);
</script>

<template>
  <ElSelect
    :clearable="clearable"
    :disabled="disabled"
    :model-value="modelValue"
    :placeholder="placeholder"
    class="w-full"
    filterable
    @change="handleChange"
  >
    <ElOption
      v-for="item in list"
      :key="item.id"
      :label="item.name"
      :value="item.id!"
    />
  </ElSelect>
</template>
