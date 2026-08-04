<script lang="ts" setup>
import type { HrmSalarySlipTemplateApi } from '#/api/hrm/salary/slip/template';

import { computed } from 'vue';

import { Button, Input, Select, Switch, Table, Tag } from 'antdv-next';

import {
  HrmSalaryOptionCategoryCode,
  HrmSalaryOptionCode,
  HrmSalarySlipTemplateOptionType,
} from '#/views/hrm/utils/constants';

defineOptions({ name: 'HrmSalarySlipTemplateOptionEditor' });

const props = withDefaults(
  defineProps<{
    maxHeight?: number;
    modelValue?: HrmSalarySlipTemplateApi.TemplateOption[];
  }>(),
  {
    maxHeight: 420,
    modelValue: () => [],
  },
);

const emit = defineEmits<{
  remove: [option: HrmSalarySlipTemplateApi.TemplateOption];
  'update:modelValue': [options: HrmSalarySlipTemplateApi.TemplateOption[]];
}>();

const categoryOptions = computed(() =>
  (props.modelValue || [])
    .filter((item) => item.type === HrmSalarySlipTemplateOptionType.CATEGORY)
    .sort(compareOption),
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
  const code = Math.min(-1, ...codes.filter((item) => item < 0)) - 1;
  emit('update:modelValue', [
    ...(props.modelValue || []),
    {
      code,
      hidden: false,
      name: '新分类',
      sort: getNextSort(),
      type: HrmSalarySlipTemplateOptionType.CATEGORY,
    },
  ]);
}

function removeOption(option: HrmSalarySlipTemplateApi.TemplateOption) {
  const options = (props.modelValue || [])
    .filter((item) => item !== option)
    .map((item) =>
      option.type === HrmSalarySlipTemplateOptionType.CATEGORY &&
      item.parentCode === option.code
        ? { ...item, parentCode: undefined }
        : item,
    );
  emit('update:modelValue', options);
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
  const index = siblings.indexOf(option);
  const target = siblings[index + offset];
  if (!target) {
    return;
  }
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
      <Button type="primary" @click="addCategory">新增分类</Button>
      <slot name="actions"></slot>
    </div>
    <Table
      :columns="[
        { dataIndex: 'type', title: '类型', width: 80 },
        { dataIndex: 'name', title: '名称', width: 160 },
        { dataIndex: 'parentCode', title: '所属分类', width: 150 },
        { dataIndex: 'hidden', title: '显示', width: 80 },
        { dataIndex: 'remark', title: '备注', width: 190 },
        { dataIndex: 'action', title: '操作', width: 138 },
      ]"
      :data-source="displayOptions"
      :pagination="false"
      :scroll="{ y: maxHeight }"
      bordered
      row-key="code"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          <Tag
            :color="
              record.type === HrmSalarySlipTemplateOptionType.CATEGORY
                ? 'blue'
                : 'default'
            "
          >
            {{
              record.type === HrmSalarySlipTemplateOptionType.CATEGORY
                ? '分类'
                : '工资项'
            }}
          </Tag>
        </template>
        <template v-else-if="column.dataIndex === 'name'">
          <Input
            v-model:value="record.name"
            :maxlength="64"
            placeholder="请输入名称"
          />
        </template>
        <template v-else-if="column.dataIndex === 'parentCode'">
          <Select
            v-if="record.type === HrmSalarySlipTemplateOptionType.ITEM"
            v-model:value="record.parentCode"
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
        <template v-else-if="column.dataIndex === 'hidden'">
          <Switch
            :checked="!record.hidden"
            :disabled="record.code === HrmSalaryOptionCode.REAL_PAY"
            @change="(checked) => handleVisibleChange(record, Boolean(checked))"
          />
        </template>
        <template v-else-if="column.dataIndex === 'remark'">
          <Input
            v-model:value="record.remark"
            allow-clear
            :maxlength="255"
            placeholder="展示在工资条提示中"
          />
        </template>
        <template v-else-if="column.dataIndex === 'action'">
          <Button
            :disabled="isFirstOption(record)"
            type="link"
            @click="moveOption(record, -1)"
          >
            上移
          </Button>
          <Button
            :disabled="isLastOption(record)"
            type="link"
            @click="moveOption(record, 1)"
          >
            下移
          </Button>
          <Button
            :disabled="record.code === HrmSalaryOptionCode.REAL_PAY"
            danger
            type="link"
            @click="removeOption(record)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
  </div>
</template>
