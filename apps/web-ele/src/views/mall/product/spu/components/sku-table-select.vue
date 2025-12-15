<!-- SKU 选择弹窗组件 -->
<script lang="ts" setup>
import type { MallSpuApi } from '#/api/mall/product/spu';

import { ref } from 'vue';

import { ElDialog } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSpu } from '#/api/mall/product/spu';

import { useSkuGridColumns } from './spu-select-data';

interface SpuData {
  spuId: number;
}

const emit = defineEmits<{
  change: [sku: MallSpuApi.Sku];
}>();

const visible = ref(false);
const spuId = ref<number>();

/** 处理选中 */
function handleRadioChange() {
  const selectedRow = gridApi.grid.getRadioRecord() as MallSpuApi.Sku;
  if (selectedRow) {
    emit('change', selectedRow);
    closeModal();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useSkuGridColumns(),
    height: 400,
    border: true,
    radioConfig: {
      reserve: true,
    },
    pagerConfig: {
      enabled: false,
    },
  },
  gridEvents: {
    radioChange: handleRadioChange,
  },
});

/** 关闭弹窗 */
function closeModal() {
  visible.value = false;
  gridApi.grid.clearRadioRow();
  spuId.value = undefined;
}

/** 打开弹窗 */
async function openModal(data?: SpuData) {
  if (!data?.spuId) {
    return;
  }
  spuId.value = data.spuId;
  visible.value = true;
  if (!spuId.value) {
    gridApi.grid?.reloadData([]);
    return;
  }
  const spu = await getSpu(spuId.value);
  gridApi.grid?.reloadData(spu.skus || []);
}

/** 对外暴露的方法 */
defineExpose({
  open: openModal,
});
</script>

<template>
  <ElDialog
    v-model="visible"
    title="选择规格"
    width="700px"
    :destroy-on-close="true"
    :append-to-body="true"
    @close="closeModal"
  >
    <Grid />
  </ElDialog>
</template>
