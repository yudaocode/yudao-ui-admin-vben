<script lang="ts" setup>
import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';

import { onMounted, ref } from 'vue';

import { ElOption, ElSelect } from 'element-plus';

import { getMachinerySimpleList } from '#/api/mes/dv/machinery';

defineOptions({ name: 'DvMachinerySelect' });

withDefaults(
  defineProps<{
    clearable?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  {
    clearable: true,
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
function handleChange(value: number | string | undefined) {
  const machineryId = typeof value === 'number' ? value : undefined;
  emit('update:modelValue', machineryId);
  emit('change', list.value.find((item) => item.id === machineryId));
}

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
