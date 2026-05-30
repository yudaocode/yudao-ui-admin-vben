<script lang="ts" setup>
import type { SelectValue } from 'ant-design-vue/es/select';

import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';

import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getMachinerySimpleList } from '#/api/mes/dv/machinery';

withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    modelValue?: number;
    placeholder?: string;
  }>(),
  { allowClear: true, disabled: false, modelValue: undefined, placeholder: '请选择设备' },
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
  emit(
    'change',
    list.value.find((item) => item.id === machineryId),
  );
}

// TODO @AI：按照目前项目的规则，会希望 /** 初始化么 */ ？如果喜欢，是不是加到 style.vue 里？
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
