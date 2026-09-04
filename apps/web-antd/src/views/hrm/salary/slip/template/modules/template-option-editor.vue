<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalarySlipTemplateApi } from '#/api/hrm/salary/slip/template';

import { computed, nextTick, watch } from 'vue';

import { Input, Select, Switch, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  HrmSalaryOptionCategoryCode,
  HrmSalaryOptionCode,
  HrmSalarySlipTemplateOptionType,
} from '#/views/hrm/utils/constants';

import { useTemplateOptionGridColumns } from '../data';

defineOptions({ name: 'HrmSalarySlipTemplateOptionEditor' });

const props = withDefaults(
  defineProps<{
    maxHeight?: number;
    modelValue?: HrmSalarySlipTemplateApi.TemplateOption[];
  }>(),
  { maxHeight: 420, modelValue: () => [] },
);
const emit = defineEmits<{
  remove: [option: HrmSalarySlipTemplateApi.TemplateOption];
  'update:modelValue': [options: HrmSalarySlipTemplateApi.TemplateOption[]];
}>();

const categoryOptions = computed(() =>
  (props.modelValue || [])
    .filter((item) => item.type === HrmSalarySlipTemplateOptionType.CATEGORY)
    .toSorted(compareOption),
);

const displayOptions = computed(() => {
  const options = props.modelValue || [];
  const result: HrmSalarySlipTemplateApi.TemplateOption[] = [];
  categoryOptions.value.forEach((category) => {
    result.push(
      category,
      ...options
        .filter(
          (item) =>
            item.type === HrmSalarySlipTemplateOptionType.ITEM &&
            item.parentCode === category.code,
        )
        .toSorted(compareOption),
    );
  });
  result.push(
    ...options
      .filter(
        (item) =>
          item.type === HrmSalarySlipTemplateOptionType.ITEM &&
          !categoryOptions.value.some(
            (category) => category.code === item.parentCode,
          ),
      )
      .toSorted(compareOption),
  );
  return result;
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useTemplateOptionGridColumns(),
    data: [],
    maxHeight: props.maxHeight,
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'code', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmSalarySlipTemplateApi.TemplateOption>,
});

watch(
  displayOptions,
  async (options) => {
    await nextTick();
    await gridApi.grid.reloadData(options);
  },
  { immediate: true },
);

function compareOption(
  first: HrmSalarySlipTemplateApi.TemplateOption,
  second: HrmSalarySlipTemplateApi.TemplateOption,
) {
  return (first.sort || 0) - (second.sort || 0);
}

function getNextSort() {
  return (
    Math.max(0, ...(props.modelValue || []).map((item) => item.sort || 0)) + 1
  );
}

function addCategory() {
  const codes = (props.modelValue || [])
    .map((item) => item.code)
    .filter((code): code is number => code !== undefined);
  emit('update:modelValue', [
    ...(props.modelValue || []),
    {
      code: Math.min(-1, ...codes.filter((item) => item < 0)) - 1,
      hidden: false,
      name: '新分类',
      sort: getNextSort(),
      type: HrmSalarySlipTemplateOptionType.CATEGORY,
    },
  ]);
}

function removeOption(option: HrmSalarySlipTemplateApi.TemplateOption) {
  emit(
    'update:modelValue',
    (props.modelValue || [])
      .filter((item) => item !== option)
      .map((item) =>
        option.type === HrmSalarySlipTemplateOptionType.CATEGORY &&
        item.parentCode === option.code
          ? { ...item, parentCode: undefined }
          : item,
      ),
  );
  emit('remove', option);
}

function handleVisibleChange(
  option: HrmSalarySlipTemplateApi.TemplateOption,
  visible: boolean,
) {
  option.hidden = !visible;
  emit('update:modelValue', [...(props.modelValue || [])]);
}

function moveOption(
  option: HrmSalarySlipTemplateApi.TemplateOption,
  offset: number,
) {
  const siblings = getSiblingOptions(option);
  const target = siblings[siblings.indexOf(option) + offset];
  if (!target) return;
  const sort = option.sort;
  option.sort = target.sort;
  target.sort = sort;
  emit('update:modelValue', [...(props.modelValue || [])]);
}

function getSiblingOptions(option: HrmSalarySlipTemplateApi.TemplateOption) {
  return (props.modelValue || [])
    .filter((item) =>
      option.type === HrmSalarySlipTemplateOptionType.CATEGORY
        ? item.type === HrmSalarySlipTemplateOptionType.CATEGORY
        : item.type === HrmSalarySlipTemplateOptionType.ITEM &&
          item.parentCode === option.parentCode,
    )
    .toSorted(compareOption);
}

function isFirstOption(option: HrmSalarySlipTemplateApi.TemplateOption) {
  return getSiblingOptions(option)[0] === option;
}

function isLastOption(option: HrmSalarySlipTemplateApi.TemplateOption) {
  const siblings = getSiblingOptions(option);
  return siblings[siblings.length - 1] === option;
}

function validate() {
  if (displayOptions.value.some((item) => !item.name?.trim())) {
    return '模板明细名称不能为空';
  }
  if (displayOptions.value.some((item) => (item.name?.length || 0) > 64)) {
    return '模板明细名称不能超过 64 个字符';
  }
  if (displayOptions.value.some((item) => (item.remark?.length || 0) > 255)) {
    return '模板明细备注不能超过 255 个字符';
  }
  if (
    categoryOptions.value.some(
      (category) =>
        !displayOptions.value.some(
          (item) =>
            item.type === HrmSalarySlipTemplateOptionType.ITEM &&
            item.parentCode === category.code,
        ),
    )
  ) {
    return '模板分类下至少需要保留一个工资项';
  }
}

function getNormalizedOptions() {
  return displayOptions.value.map((item, index) => ({
    ...item,
    parentCode:
      item.type === HrmSalarySlipTemplateOptionType.CATEGORY
        ? HrmSalaryOptionCategoryCode.ROOT
        : item.parentCode || HrmSalaryOptionCategoryCode.ROOT,
    sort: index + 1,
  }));
}

defineExpose({ getNormalizedOptions, validate });
</script>

<template>
  <div class="w-full">
    <div class="mb-3 flex items-center gap-3">
      <TableAction
        :actions="[
          {
            label: '新增分类',
            type: 'primary',
            icon: ACTION_ICON.ADD,
            onClick: addCategory,
          },
        ]"
      />
      <slot name="actions"></slot>
    </div>
    <Grid class="w-full">
      <template #type="{ row }">
        <Tag
          :color="
            row.type === HrmSalarySlipTemplateOptionType.CATEGORY
              ? 'blue'
              : 'default'
          "
        >
          {{
            row.type === HrmSalarySlipTemplateOptionType.CATEGORY
              ? '分类'
              : '工资项'
          }}
        </Tag>
      </template>
      <template #name="{ row }">
        <Input
          v-model:value="row.name"
          :maxlength="64"
          placeholder="请输入名称"
        />
      </template>
      <template #parentCode="{ row }">
        <Select
          v-if="row.type === HrmSalarySlipTemplateOptionType.ITEM"
          v-model:value="row.parentCode"
          :options="
            categoryOptions.map((category) => ({
              label: category.name,
              value: category.code,
            }))
          "
          allow-clear
          class="w-full"
          placeholder="不分类"
        />
        <span v-else>-</span>
      </template>
      <template #hidden="{ row }">
        <Switch
          :checked="!row.hidden"
          :disabled="row.code === HrmSalaryOptionCode.REAL_PAY"
          @change="(checked) => handleVisibleChange(row, Boolean(checked))"
        />
      </template>
      <template #remark="{ row }">
        <Input
          v-model:value="row.remark"
          allow-clear
          :maxlength="255"
          placeholder="展示在工资条提示中"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '上移',
              type: 'link',
              disabled: isFirstOption(row),
              onClick: moveOption.bind(null, row, -1),
            },
            {
              label: '下移',
              type: 'link',
              disabled: isLastOption(row),
              onClick: moveOption.bind(null, row, 1),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: row.code === HrmSalaryOptionCode.REAL_PAY,
              onClick: removeOption.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
