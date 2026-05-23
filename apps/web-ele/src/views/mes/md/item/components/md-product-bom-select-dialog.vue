<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdProductBomApi } from '#/api/mes/md/item/productBom';

import { nextTick, ref } from 'vue';

import { ElButton, ElDialog, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getProductBomListByItemId } from '#/api/mes/md/item/productBom';

import { useProductBomGridColumns } from '../data';

defineOptions({ name: 'MdProductBomSelectDialog' });

const emit = defineEmits<{
  selected: [row: MesMdProductBomApi.ProductBom];
}>();

const open = ref(false); // 弹窗是否打开
const list = ref<MesMdProductBomApi.ProductBom[]>([]); // BOM 子物料列表
const selectedRow = ref<MesMdProductBomApi.ProductBom>(); // 当前选中的 BOM 行

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: [
      { type: 'radio', width: 55, align: 'center' },
      ...(useProductBomGridColumns(true) || []),
    ],
    data: list.value,
    height: 500,
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    radioConfig: {
      highlight: true,
      trigger: 'row',
    },
    rowConfig: {
      keyField: 'bomItemId',
      isHover: true,
    },
    showOverflow: true,
    toolbarConfig: {
      enabled: false,
    },
  } as VxeTableGridOptions<MesMdProductBomApi.ProductBom>,
  gridEvents: {
    cellDblclick: ({ row }: { row: MesMdProductBomApi.ProductBom }) => {
      selectedRow.value = row;
      gridApi.grid.setRadioRow(row);
      handleConfirm();
    },
    radioChange: ({ row }: { row: MesMdProductBomApi.ProductBom }) => {
      selectedRow.value = row;
    },
  },
});

/** 打开 BOM 物料选择弹窗 */
async function openModal(itemId: number, selectedBomItemId?: number) {
  open.value = true;
  selectedRow.value = undefined;
  gridApi.setLoading(true);
  try {
    list.value = await getProductBomListByItemId(itemId);
    gridApi.setGridOptions({ data: list.value });
    await nextTick();
    if (selectedBomItemId != null) {
      const match = list.value.find(
        (row) => row.bomItemId === selectedBomItemId,
      );
      if (match) {
        selectedRow.value = match;
        gridApi.grid.setRadioRow(match);
      }
    }
  } finally {
    gridApi.setLoading(false);
  }
}

/** 关闭 BOM 物料选择弹窗 */
async function closeModal() {
  open.value = false;
  selectedRow.value = undefined;
  await gridApi.grid.clearRadioRow();
}

/** 确认选择 BOM 物料 */
function handleConfirm() {
  if (!selectedRow.value) {
    ElMessage.warning('请选择一条数据');
    return;
  }
  emit('selected', selectedRow.value);
  open.value = false;
}

defineExpose({ open: openModal });
</script>

<template>
  <ElDialog
    v-model="open"
    title="产品 BOM 物料选择"
    width="800px"
    destroy-on-close
    @close="closeModal"
  >
    <Grid table-title="BOM 子物料列表" />
    <template #footer>
      <ElButton @click="closeModal">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>
