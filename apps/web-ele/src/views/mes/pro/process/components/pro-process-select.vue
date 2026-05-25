<script lang="ts" setup>
import type { MesProProcessApi } from '#/api/mes/pro/process';

import { computed, onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus';

import { getProcessSimpleList } from '#/api/mes/pro/process';

defineOptions({ name: 'ProProcessSelect', inheritAttrs: false });

const props = withDefaults(
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
    placeholder: '请选择工序',
  },
);

const emit = defineEmits<{
  change: [item: MesProProcessApi.Process | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesProProcessApi.Process[]>([]);
const filteredList = ref<MesProProcessApi.Process[]>([]);
const selectedItem = ref<MesProProcessApi.Process>();

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

function handleFilter(query: string) {
  if (!query) {
    filteredList.value = allList.value;
    return;
  }
  const keyword = query.toLowerCase();
  filteredList.value = allList.value.filter(
    (item) =>
      item.name?.toLowerCase().includes(keyword) ||
      item.code?.toLowerCase().includes(keyword),
  );
}

/** 根据当前值同步 tooltip 展示的工序详情 */
function syncSelectedItem(value: number | undefined) {
  selectedItem.value =
    value === undefined
      ? undefined
      : allList.value.find((item) => item.id === value);
}

/** 除 v-model 外，额外抛出完整工序对象给业务表单使用 */
function handleChange(value: number | undefined) {
  syncSelectedItem(value);
  emit('change', selectedItem.value);
}

watch(
  () => props.modelValue,
  (value) => {
    syncSelectedItem(value);
  },
);

onMounted(async () => {
  allList.value = await getProcessSimpleList();
  filteredList.value = allList.value;
  syncSelectedItem(props.modelValue);
});
</script>

<template>
  <ElTooltip :disabled="!selectedItem" placement="top" :show-after="500">
    <template #content>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>工艺要求：{{ selectedItem.attention || '-' }}</div>
        <div>备注：{{ selectedItem.remark || '-' }}</div>
      </div>
    </template>
    <ElSelect
      v-bind="$attrs"
      v-model="selectValue"
      :clearable="clearable"
      :disabled="disabled"
      :filter-method="handleFilter"
      :placeholder="placeholder"
      class="w-full"
      filterable
      @change="handleChange"
    >
      <ElOption
        v-for="item in filteredList"
        :key="item.id"
        :label="item.name"
        :value="item.id!"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.name }}</span>
          <ElTag v-if="item.code" size="small" type="info">
            {{ item.code }}
          </ElTag>
        </div>
      </ElOption>
    </ElSelect>
  </ElTooltip>
</template>
