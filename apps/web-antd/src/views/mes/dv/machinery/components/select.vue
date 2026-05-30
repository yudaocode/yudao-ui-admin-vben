<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getMachinerySimpleList } from '#/api/mes/dv/machinery';

defineOptions({ name: 'DvMachinerySelect' });

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    modelValue: undefined,
    placeholder: '请选择设备',
  },
);
const emit = defineEmits<{
  change: [row?: MesDvMachineryApi.Machinery];
  'update:modelValue': [value?: number];
}>();
const list = ref<MesDvMachineryApi.Machinery[]>([]); // 设备列表

/** 加载设备列表 */
async function getList() {
  list.value = await getMachinerySimpleList();
}

/** 处理设备选择变化 */
function handleChange(value: SelectValue) {
  const machineryId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', machineryId);
  emit('change', list.value.find((item) => item.id === machineryId));
}

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
