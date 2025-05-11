<script lang="ts" setup>
import type { InfraCodegenApi } from '#/api/infra/codegen';
import type { SystemDictTypeApi } from '#/api/system/dict/type';

import { nextTick, onMounted, ref, watch } from 'vue';

import { NCheckbox, NInput, NSelect } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSimpleDictTypeList } from '#/api/system/dict/type';

import { useCodegenColumnTableColumns } from '../data';

const props = defineProps<{
  columns?: InfraCodegenApi.CodegenColumn[];
}>();

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCodegenColumnTableColumns(),
    border: true,
    showOverflow: true,
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
  async (columns) => {
    if (!columns) {
      return;
    }
    await nextTick();
    gridApi.grid?.loadData(columns);
  },
  {
    immediate: true,
  },
);

/** 提供获取表格数据的方法供父组件调用 */
defineExpose({
  getData: (): InfraCodegenApi.CodegenColumn[] => gridApi.grid.getData(),
});

/** 初始化 */
const dictTypeOptions = ref<SystemDictTypeApi.DictType[]>([]); // 字典类型选项
onMounted(async () => {
  dictTypeOptions.value = await getSimpleDictTypeList();
});
</script>

<template>
  <Grid>
    <!-- 字段描述 -->
    <template #columnComment="{ row }">
      <NInput v-model:value="row.columnComment" />
    </template>

    <!-- Java 类型 -->
    <template #javaType="{ row, column }">
      <NSelect v-model:value="row.javaType" style="width: 100%">
        <NSelect.Option
          v-for="option in column.params.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </NSelect.Option>
      </NSelect>
    </template>
    <!-- Java 属性 -->
    <template #javaField="{ row }">
      <NInput v-model:value="row.javaField" />
    </template>

    <!-- 插入 -->
    <template #createOperation="{ row }">
      <NCheckbox v-model:checked="row.createOperation" />
    </template>
    <!-- 编辑 -->
    <template #updateOperation="{ row }">
      <NCheckbox v-model:checked="row.updateOperation" />
    </template>
    <!-- 列表 -->
    <template #listOperationResult="{ row }">
      <NCheckbox v-model:checked="row.listOperationResult" />
    </template>
    <!-- 查询 -->
    <template #listOperation="{ row }">
      <NCheckbox v-model:checked="row.listOperation" />
    </template>

    <!-- 查询方式 -->
    <template #listOperationCondition="{ row, column }">
      <NSelect v-model:value="row.listOperationCondition" class="w-full">
        <NSelect.Option
          v-for="option in column.params.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </NSelect.Option>
      </NSelect>
    </template>

    <!-- 允许空 -->
    <template #nullable="{ row }">
      <NCheckbox v-model:checked="row.nullable" />
    </template>

    <!-- 显示类型 -->
    <template #htmlType="{ row, column }">
      <NSelect v-model:value="row.htmlType" class="w-full">
        <NSelect.Option
          v-for="option in column.params.options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </NSelect.Option>
      </NSelect>
    </template>

    <!-- 字典类型 -->
    <template #dictType="{ row }">
      <NSelect
        v-model:value="row.dictType"
        class="w-full"
        allow-clear
        show-search
      >
        >
        <NSelect.Option
          v-for="option in dictTypeOptions"
          :key="option.type"
          :value="option.type"
        >
          {{ option.name }}
        </NSelect.Option>
      </NSelect>
    </template>

    <!-- 示例 -->
    <template #example="{ row }">
      <NInput v-model:value="row.example" />
    </template>
  </Grid>
</template>
