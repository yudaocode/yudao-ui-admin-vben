<script lang="ts" setup>
import type { MesMdUnitMeasureApi } from '#/api/mes/md/unitmeasure';

import { computed, onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus';

import { getUnitMeasureSimpleList } from '#/api/mes/md/unitmeasure';

defineOptions({ name: 'MdUnitMeasureSelect', inheritAttrs: false });

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
    placeholder: '请选择计量单位',
  },
);

const emit = defineEmits<{
  change: [item: MesMdUnitMeasureApi.UnitMeasure | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesMdUnitMeasureApi.UnitMeasure[]>([]); // 计量单位列表
const filteredList = ref<MesMdUnitMeasureApi.UnitMeasure[]>([]); // 过滤后的计量单位列表
const selectedItem = ref<MesMdUnitMeasureApi.UnitMeasure>(); // 当前选中计量单位

const selectValue = computed({
  // 选择器绑定值
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 前端按名称和编码过滤计量单位 */
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

/** 根据当前值同步 tooltip 展示的计量单位详情 */
function syncSelectedItem(value: number | undefined) {
  selectedItem.value =
    value === undefined
      ? undefined
      : allList.value.find((item) => item.id === value);
}

/** 除 v-model 外，额外抛出完整计量单位对象给业务表单使用 */
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
  allList.value = await getUnitMeasureSimpleList();
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
        <div>是否主单位：{{ selectedItem.primaryFlag ? '是' : '否' }}</div>
        <div
          v-if="!selectedItem.primaryFlag && selectedItem.changeRate != null"
        >
          换算比例：{{ selectedItem.changeRate }}
        </div>
        <div v-if="selectedItem.remark">备注：{{ selectedItem.remark }}</div>
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
            编号: {{ item.code }}
          </ElTag>
        </div>
      </ElOption>
    </ElSelect>
  </ElTooltip>
</template>
