<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { Cascader, InputNumber } from 'ant-design-vue';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAreaTree } from '#/api/system/area';

import { useFreesColumns } from '../data';

interface Props {
  items?: any[];
  disabled?: boolean;
  chargeMode?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  disabled: false,
  chargeMode: 1,
});

const emit = defineEmits(['update:items']);

const tableData = ref<any[]>([]);
const areaTree = ref([]);

// 根据计费方式设置列标题
const columnTitle = computed(() => {
  const titleMap = {
    1: { freeCountTitle: '包邮件数' },
    2: { freeCountTitle: '包邮重量(kg)' },
    3: { freeCountTitle: '包邮体积(m³)' },
  };
  return titleMap[props.chargeMode] || titleMap[1];
});

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useFreesColumns(),
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

// TODO @AI：待优化。
/** 更新列标题 */
function updateColumnsTitle() {
  const columns = useFreesColumns();
  const freeCountCol = columns.find((col) => col.field === 'freeCount');

  if (freeCountCol) freeCountCol.title = columnTitle.value.freeCountTitle;

  if (gridApi.grid) {
    gridApi.grid.reloadColumn(columns);
  }
}

/** 处理新增 */
function handleAdd() {
  const newRow = {
    seq: Date.now(),
    areaIds: [],
    freeCount: 1,
    freePrice: 1,
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

/** 处理区域变更 */
function handleAreaChange(areaIds: any[], row: any) {
  row.areaIds = areaIds;
  handleRowChange(row);
}

/** 处理数值变更 */
function handleValueChange(field: string, value: any, row: any) {
  row[field] = value;
  handleRowChange(row);
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
      throw new Error(`包邮设置第 ${i + 1} 行：区域不能为空`);
    }
    if (!item.freeCount || item.freeCount <= 0) {
      throw new Error(
        `包邮设置第 ${i + 1} 行：${columnTitle.value.freeCountTitle}必须大于0`,
      );
    }
    if (!item.freePrice || item.freePrice <= 0) {
      throw new Error(`包邮设置第 ${i + 1} 行：包邮金额必须大于0`);
    }
  }
}

defineExpose({
  validate,
});

/** 初始化 */
onMounted(async () => {
  try {
    areaTree.value = await getAreaTree();
  } catch (error) {
    console.error('加载区域数据失败:', error);
  }
});
</script>

<template>
  <Grid class="w-full">
    <template #areaIds="{ row }">
      <Cascader
        v-model:value="row.areaIds"
        :options="areaTree"
        :field-names="{
          label: 'name',
          value: 'id',
          children: 'children',
        }"
        placeholder="请选择地区"
        class="w-full"
        multiple
        show-checked-strategy="SHOW_CHILD"
        :disabled="disabled"
        @change="handleAreaChange($event, row)"
      />
    </template>
    <template #freeCount="{ row }">
      <InputNumber
        v-model:value="row.freeCount"
        :min="1"
        class="w-full"
        :disabled="disabled"
        @change="handleValueChange('freeCount', $event, row)"
      />
    </template>
    <template #freePrice="{ row }">
      <InputNumber
        v-model:value="row.freePrice"
        :min="0"
        :precision="2"
        class="w-full"
        :disabled="disabled"
        @change="handleValueChange('freePrice', $event, row)"
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        v-if="!disabled"
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
        v-if="!disabled"
        class="mt-2 flex justify-center"
        :actions="[
          {
            label: '添加包邮区域',
            type: 'default',
            onClick: handleAdd,
          },
        ]"
      />
    </template>
  </Grid>
</template>
