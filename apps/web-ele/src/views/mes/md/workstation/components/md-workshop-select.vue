<script lang="ts" setup>
import type { MesMdWorkshopApi } from '#/api/mes/md/workstation/workshop';

import { computed, onMounted, ref, watch } from 'vue';

import { ElOption, ElSelect, ElTag, ElTooltip } from 'element-plus';

import { getWorkshopSimpleList } from '#/api/mes/md/workstation/workshop';

defineOptions({ name: 'MdWorkshopSelect', inheritAttrs: false });

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
    placeholder: '请选择车间',
  },
);

const emit = defineEmits<{
  change: [item: MesMdWorkshopApi.Workshop | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesMdWorkshopApi.Workshop[]>([]);
const filteredList = ref<MesMdWorkshopApi.Workshop[]>([]);
const selectedItem = ref<MesMdWorkshopApi.Workshop>(); // 选中的车间

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

/** 前端过滤车间名称和编码 */
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

/** 根据当前值同步 tooltip 展示的车间详情 */
function syncSelectedItem(value: number | undefined) {
  selectedItem.value =
    value === undefined
      ? undefined
      : allList.value.find((item) => item.id === value);
}

/** 除 v-model 外，额外抛出完整车间对象给业务表单使用 */
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
  allList.value = await getWorkshopSimpleList();
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
        <div>
          面积：{{
            selectedItem.area != null ? `${selectedItem.area} ㎡` : '-'
          }}
        </div>
        <div>负责人：{{ selectedItem.chargeUserName || '-' }}</div>
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
          <ElTag v-if="item.code" type="info">{{ item.code }}</ElTag>
        </div>
      </ElOption>
    </ElSelect>
  </ElTooltip>
</template>
