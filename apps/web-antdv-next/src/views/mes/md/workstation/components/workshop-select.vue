<script lang="ts" setup>
import type { MesMdWorkshopApi } from '#/api/mes/md/workstation/workshop';

import { computed, onMounted, ref, watch } from 'vue';

import { Select, Tag, Tooltip } from 'antdv-next';

import { getWorkshopSimpleList } from '#/api/mes/md/workstation/workshop';

defineOptions({ name: 'MdWorkshopSelect', inheritAttrs: false });

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
    placeholder: '请选择车间',
  },
);

const emit = defineEmits<{
  change: [item: MesMdWorkshopApi.Workshop | undefined];
  'update:modelValue': [value: number | undefined];
}>();

const allList = ref<MesMdWorkshopApi.Workshop[]>([]);
const selectedItem = ref<MesMdWorkshopApi.Workshop>();
const selectOptions = computed(() =>
  allList.value.map((item) => ({
    label: item.name,
    value: item.id,
    raw: item,
  })),
);

const selectValue = computed({
  get: () => props.modelValue,
  set: (value: number | undefined) => {
    emit('update:modelValue', value);
  },
});

function handleFilter(input: string, option: any) {
  const keyword = input.toLowerCase();
  const item = option?.raw as MesMdWorkshopApi.Workshop | undefined;
  return Boolean(
    item?.name?.toLowerCase().includes(keyword) ||
    item?.code?.toLowerCase().includes(keyword),
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
  allList.value = await getWorkshopSimpleList();
  syncSelectedItem(props.modelValue);
});
</script>

<template>
  <Tooltip :mouse-enter-delay="0.5" :open="selectedItem ? undefined : false">
    <template #title>
      <div v-if="selectedItem" class="leading-6">
        <div>编码：{{ selectedItem.code || '-' }}</div>
        <div>名称：{{ selectedItem.name || '-' }}</div>
        <div>
          面积：{{
            selectedItem.area !== null ? `${selectedItem.area} ㎡` : '-'
          }}
        </div>
        <div>负责人：{{ selectedItem.chargeUserName || '-' }}</div>
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
      :options="selectOptions"
      @change="handleChange"
    >
      <template #optionRender="{ option }">
        <div class="flex items-center gap-2">
          <span>{{ option.data.raw.name }}</span>
          <Tag v-if="option.data.raw.code" color="default">
            {{ option.data.raw.code }}
          </Tag>
        </div>
      </template>
    </Select>
  </Tooltip>
</template>
