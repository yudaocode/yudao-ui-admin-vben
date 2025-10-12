<script lang="ts" setup>
import type { MallDeliveryExpressTemplateApi } from '#/api/mall/trade/delivery/expressTemplate';
import type { SystemAreaApi } from '#/api/system/area';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { InputNumber, TreeSelect } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAreaTree } from '#/api/system/area';

import { useChargesColumns } from '../data';

interface Props {
  items?: MallDeliveryExpressTemplateApi.TemplateCharge[];
  chargeMode?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  chargeMode: 1,
});

const emit = defineEmits(['update:items']);

const tableData = ref<any[]>([]);
const areaTree = ref<SystemAreaApi.Area[]>([]);

// TODO @AI：待优化；
// 根据计费方式设置列标题
const columnTitle = computed(() => {
  const titleMap = {
    1: { startCountTitle: '首件', extraCountTitle: '续件' },
    2: { startCountTitle: '首件重量(kg)', extraCountTitle: '续件重量(kg)' },
    3: { startCountTitle: '首件体积(m³)', extraCountTitle: '续件体积(m³)' },
  };
  return titleMap[props.chargeMode] || titleMap[1];
});

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useChargesColumns(),
    data: tableData.value,
    minHeight: 200,
    autoResize: true,
    border: true,
    rowConfig: {
      keyField: 'seq',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    toolbarConfig: {
      enabled: false,
    },
  },
});

/** 监听外部传入的数据 */
watch(
  () => props.items,
  async (items) => {
    if (!items) {
      return;
    }
    tableData.value = [...items];
    await nextTick();
    await gridApi.grid.reloadData(tableData.value);
    updateColumnsTitle();
  },
  {
    immediate: true,
  },
);

/** 监听计费方式变化 */
watch(
  () => props.chargeMode,
  () => {
    updateColumnsTitle();
  },
);

/** 更新列标题 */
function updateColumnsTitle() {
  const columns = useChargesColumns();
  const startCountCol = columns.find((col) => col.field === 'startCount');
  const extraCountCol = columns.find((col) => col.field === 'extraCount');

  if (startCountCol) startCountCol.title = columnTitle.value.startCountTitle;
  if (extraCountCol) extraCountCol.title = columnTitle.value.extraCountTitle;

  if (gridApi.grid) {
    gridApi.grid.reloadColumn(columns);
  }
}

/** 处理新增 */
function handleAdd() {
  const newRow = {
    areaIds: [],
    startCount: undefined,
    startPrice: undefined,
    extraCount: undefined,
    extraPrice: undefined,
  };
  tableData.value.push(newRow);
  emit('update:items', [...tableData.value]);
}

/** 处理删除 */
function handleDelete(row: any) {
  const index = tableData.value.findIndex((item) => item.seq === row.seq);
  if (index !== -1) {
    tableData.value.splice(index, 1);
  }
  emit('update:items', [...tableData.value]);
}

/** 处理行数据变更 */
function handleRowChange(row: any) {
  const index = tableData.value.findIndex((item) => item.seq === row.seq);
  if (index === -1) {
    tableData.value.push(row);
  } else {
    tableData.value[index] = row;
  }
  emit('update:items', [...tableData.value]);
}

/** 表单校验 */
function validate() {
  for (let i = 0; i < tableData.value.length; i++) {
    const item = tableData.value[i];
    if (!item.areaIds || item.areaIds.length === 0) {
      throw new Error(`运费设置第 ${i + 1} 行：区域不能为空`);
    }
    if (!item.startCount || item.startCount <= 0) {
      throw new Error(
        `运费设置第 ${i + 1} 行：${columnTitle.value.startCountTitle}必须大于 0`,
      );
    }
    if (!item.startPrice || item.startPrice <= 0) {
      throw new Error(`运费设置第 ${i + 1} 行：运费必须大于0`);
    }
    if (!item.extraCount || item.extraCount <= 0) {
      throw new Error(
        `运费设置第 ${i + 1} 行：${columnTitle.value.extraCountTitle}必须大于 0`,
      );
    }
    if (!item.extraPrice || item.extraPrice <= 0) {
      throw new Error(`运费设置第 ${i + 1} 行：续费必须大于 0`);
    }
  }
}

defineExpose({
  validate,
});

/** 初始化 */
onMounted(async () => {
  areaTree.value = await getAreaTree();
});
</script>

<template>
  <Grid class="w-full">
    <template #areaIds="{ row }">
      <TreeSelect
        v-model:value="row.areaIds"
        :tree-data="areaTree"
        :field-names="{
          label: 'name',
          value: 'id',
          children: 'children',
        }"
        placeholder="请选择地区"
        class="w-full"
        multiple
        tree-checkable
        :show-checked-strategy="TreeSelect.SHOW_CHILD"
        :max-tag-count="5"
        @change="handleRowChange(row)"
      />
    </template>
    <template #startCount="{ row }">
      <InputNumber
        v-model:value="row.startCount"
        :min="1"
        @change="handleRowChange(row)"
      />
    </template>
    <template #startPrice="{ row }">
      <InputNumber
        v-model:value="row.startPrice"
        :min="0"
        :precision="2"
        @change="handleRowChange(row)"
      />
    </template>
    <template #extraCount="{ row }">
      <InputNumber
        v-model:value="row.extraCount"
        :min="1"
        @change="handleRowChange(row)"
      />
    </template>
    <template #extraPrice="{ row }">
      <InputNumber
        v-model:value="row.extraPrice"
        :min="0"
        :precision="2"
        @change="handleRowChange(row)"
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: '删除',
            type: 'link',
            danger: true,
            popConfirm: {
              title: '确认删除该区域吗？',
              confirm: handleDelete.bind(null, row),
            },
          },
        ]"
      />
    </template>
    <template #bottom>
      <TableAction
        class="mt-2 flex justify-center"
        :actions="[
          {
            label: '添加计费区域',
            type: 'default',
            onClick: handleAdd,
          },
        ]"
      />
    </template>
  </Grid>
</template>
