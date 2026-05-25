<script lang="ts" setup>
import type { MesProProcessApi } from '#/api/mes/pro/process';

import { computed, onMounted, ref, watch } from 'vue';

import { Select, Tag, Tooltip } from 'ant-design-vue';

import { getProcessSimpleList } from '#/api/mes/pro/process';

defineOptions({ name: 'ProProcessSelect', inheritAttrs: false });

const props = withDefaults(
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
    placeholder: '请选择工序',
  },
);

const emit = defineEmits<{
  change: [item: MesProProcessApi.Process | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesProProcessApi.Process[]>([]);
const selectedItem = ref<MesProProcessApi.Process>();

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 前端过滤：按工序名称或编码模糊匹配 */
function handleFilter(input: string, option: any) {
  const keyword = input.toLowerCase();
  const item = option?.item as MesProProcessApi.Process | undefined;
  return Boolean(
    item?.name?.toLowerCase().includes(keyword) ||
      item?.code?.toLowerCase().includes(keyword),
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
function handleChange(value: any) {
  const nextValue = value === undefined ? undefined : Number(value);
  syncSelectedItem(nextValue);
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
  syncSelectedItem(props.modelValue);
});
</script>

<template>
  <Tooltip :mouse-enter-delay="0.5" :open="selectedItem ? undefined : false">
    <template #title>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>工艺要求：{{ selectedItem.attention || '-' }}</div>
        <div>备注：{{ selectedItem.remark || '-' }}</div>
      </div>
    </template>
    <Select
      v-bind="$attrs"
      v-model:value="selectValue"
      :allow-clear="allowClear"
      :disabled="disabled"
      :filter-option="handleFilter"
      :placeholder="placeholder"
      class="w-full"
      show-search
      @change="handleChange"
    >
      <Select.Option
        v-for="item in allList"
        :key="item.id"
        :item="item"
        :value="item.id"
      >
        <div class="flex items-center gap-2">
          <span>{{ item.name }}</span>
          <Tag v-if="item.code" color="default">{{ item.code }}</Tag>
        </div>
      </Select.Option>
    </Select>
  </Tooltip>
</template>
