<script lang="ts" setup>
import type { OaSupplyIssueApi } from '#/api/oa/supply/issue';
import type { OaSupplyItemApi } from '#/api/oa/supply/item';

import { nextTick, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { InputNumber, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import ItemSelect from '#/views/oa/supply/item/components/item-select.vue';

import { useFormItemColumns } from '../data';

interface Props {
  items?: OaSupplyIssueApi.SupplyApplyItem[];
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
});

const emit = defineEmits(['update:items']);

const [ItemSelectModal, itemSelectModalApi] = useVbenModal({
  connectedComponent: ItemSelect,
  destroyOnClose: true,
});

const tableData = ref<OaSupplyIssueApi.SupplyApplyItem[]>([]); // 表格数据

/** 表格配置 */
const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useFormItemColumns(),
    data: tableData.value,
    minHeight: 200,
    autoResize: true,
    border: true,
    rowConfig: {
      keyField: 'itemId',
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

/** 监听外部传入的领用明细 */
watch(
  () => props.items,
  async (items) => {
    if (!items) {
      return;
    }
    tableData.value = [...items];
    await nextTick(); // 特殊：保证 gridApi 已经初始化
    await gridApi.grid.reloadData(tableData.value);
  },
  {
    immediate: true,
  },
);

/** 打开物品选择弹窗 */
function handleAdd() {
  itemSelectModalApi.setData(null).open();
}

/** 选择领用物品 */
function handleSelectItem(item: OaSupplyItemApi.SupplyItem) {
  if (tableData.value.some((row) => row.itemId === item.id)) {
    message.warning('该物品已添加');
    return;
  }
  tableData.value.push({
    itemId: item.id,
    itemName: item.name,
    model: item.model,
    unit: item.unit,
    manageType: item.manageType,
    applyQuantity: 1,
  });
  emit('update:items', [...tableData.value]);
}

/** 删除领用物品 */
function handleDelete(row: OaSupplyIssueApi.SupplyApplyItem) {
  const index = tableData.value.findIndex((item) => item.itemId === row.itemId);
  if (index !== -1) {
    tableData.value.splice(index, 1);
  }
  emit('update:items', [...tableData.value]);
}

/** 领用数量变更 */
function handleQuantityChange(row: OaSupplyIssueApi.SupplyApplyItem) {
  const index = tableData.value.findIndex((item) => item.itemId === row.itemId);
  if (index !== -1) {
    tableData.value[index] = row;
  }
  emit('update:items', [...tableData.value]);
}

/** 表单校验 */
function validate() {
  if (tableData.value.length === 0) {
    throw new Error('请添加领用明细');
  }
  if (
    tableData.value.some((item) => !item.applyQuantity || item.applyQuantity < 1)
  ) {
    throw new Error('请填写每行领用数量，数量不能小于 1');
  }
}

defineExpose({
  validate,
});
</script>

<template>
  <ItemSelectModal @select="handleSelectItem" />

  <Grid class="w-full">
    <template #applyQuantity="{ row }">
      <InputNumber
        v-model:value="row.applyQuantity"
        :min="1"
        :precision="0"
        class="!w-full"
        @change="handleQuantityChange(row)"
      />
    </template>
    <template #actions="{ row }">
      <TableAction
        :actions="[
          {
            label: '删除',
            type: 'link',
            danger: true,
            onClick: handleDelete.bind(null, row),
          },
        ]"
      />
    </template>

    <template #bottom>
      <TableAction
        class="mt-2 flex justify-center"
        :actions="[
          {
            label: '添加办公用品',
            type: 'default',
            icon: ACTION_ICON.ADD,
            onClick: handleAdd,
          },
        ]"
      />
    </template>
  </Grid>
</template>
