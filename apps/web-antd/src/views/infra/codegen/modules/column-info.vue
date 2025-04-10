<script lang="ts" setup>
import type { InfraCodegenApi } from '#/api/infra/codegen';
import type { SystemDictTypeApi } from '#/api/system/dict/type';

import { Checkbox, Input, Select } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleDictTypeList } from '#/api/system/dict/type';
import { ref, watch } from 'vue';

import { useCodegenColumnTableColumns } from '../data';

defineOptions({ name: 'InfraCodegenColumInfoForm' });

const props = defineProps<{
  columns?: InfraCodegenApi.CodegenColumn[];
}>();

/** 表格配置 */
const [Grid, extendedApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCodegenColumnTableColumns(),
    border: true,
    showOverflow: true,
    height: 'auto',
    autoResize: true,
    keepSource: true,
    rowConfig: {
      keyField: 'id',
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 监听外部传入的列数据 */
watch(
  () => props.columns,
  (columns) => {
    if (!columns) {
      return;
    }
    setTimeout(() => {
      extendedApi.grid?.loadData(columns);
    }, 100);
  },
  {
    immediate: true,
  },
);

/** 提供获取表格数据的方法供父组件调用 */
defineExpose({
  getData: (): InfraCodegenApi.CodegenColumn[] => extendedApi.grid.getData(),
});

/** 字典类型选项 */
const dictTypeOptions = ref<{ label: string; value: string }[]>([]);
const loadDictTypeOptions = async () => {
  const dictTypes = await getSimpleDictTypeList();
  dictTypeOptions.value = dictTypes.map((dict: SystemDictTypeApi.SystemDictType) => ({
    label: dict.name,
    value: dict.type,
  }));
};

loadDictTypeOptions();
</script>

<template>
  <Grid>
    <!-- 字段描述 -->
    <template #columnComment="{ row }">
      <Input v-model:value="row.columnComment" />
    </template>

    <!-- Java类型 -->
    <template #javaType="{ row, column }">
      <Select v-model:value="row.javaType" style="width: 100%">
        <Select.Option v-for="option in column.params.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </Select.Option>
      </Select>
    </template>

    <!-- Java属性 -->
    <template #javaField="{ row }">
      <Input v-model:value="row.javaField" />
    </template>

    <!-- 插入 -->
    <template #createOperation="{ row }">
      <Checkbox v-model:checked="row.createOperation" />
    </template>

    <!-- 编辑 -->
    <template #updateOperation="{ row }">
      <Checkbox v-model:checked="row.updateOperation" />
    </template>

    <!-- 列表 -->
    <template #listOperationResult="{ row }">
      <Checkbox v-model:checked="row.listOperationResult" />
    </template>

    <!-- 查询 -->
    <template #listOperation="{ row }">
      <Checkbox v-model:checked="row.listOperation" />
    </template>

    <!-- 查询方式 -->
    <template #listOperationCondition="{ row, column }">
      <Select v-model:value="row.listOperationCondition" style="width: 100%">
        <Select.Option v-for="option in column.params.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </Select.Option>
      </Select>
    </template>

    <!-- 允许空 -->
    <template #nullable="{ row }">
      <Checkbox v-model:checked="row.nullable" />
    </template>

    <!-- 显示类型 -->
    <template #htmlType="{ row, column }">
      <Select v-model:value="row.htmlType" style="width: 100%">
        <Select.Option v-for="option in column.params.options" :key="option.value" :value="option.value">
          {{ option.label }}
        </Select.Option>
      </Select>
    </template>

    <!-- 字典类型 -->
    <template #dictType="{ row }">
      <Select v-model:value="row.dictType" style="width: 100%" allow-clear show-search>
        <Select.Option v-for="option in dictTypeOptions" :key="option.value" :value="option.value">
          {{ option.label }}
        </Select.Option>
      </Select>
    </template>

    <!-- 示例 -->
    <template #example="{ row }">
      <Input v-model:value="row.example" />
    </template>
  </Grid>
</template>
