<!-- SKU 选择弹窗组件 -->
<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { ref } from 'vue';

import { fenToYuan } from '@vben/utils';

import { Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSpu } from '#/api/mall/product/spu';

interface SpuData {
  spuId: number;
}

const emit = defineEmits<{
  change: [sku: MallSpuApi.Sku];
}>();

const visible = ref(false);
const spuId = ref<number>();

/** 表格列配置 */
const gridColumns: VxeGridProps['columns'] = [
  {
    type: 'radio',
    width: 55,
  },
  {
    field: 'picUrl',
    title: '图片',
    width: 100,
    align: 'center',
    cellRender: {
      name: 'CellImage',
    },
  },
  {
    field: 'properties',
    title: '规格',
    minWidth: 120,
    align: 'center',
    formatter: ({ cellValue }) => {
      return (
        cellValue?.map((p: MallSpuApi.Property) => p.valueName)?.join(' ') ||
        '-'
      );
    },
  },
  {
    field: 'price',
    title: '销售价(元)',
    width: 120,
    align: 'center',
    formatter: ({ cellValue }) => {
      return fenToYuan(cellValue);
    },
  },
];

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: gridColumns,
    height: 400,
    border: true,
    showOverflow: true,
    radioConfig: {
      reserve: true,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      // TODO @puhui999：看看注释的部分，后续要不要删除
      // autoLoad: false, // 禁用自动加载，手动触发查询
      ajax: {
        query: async () => {
          if (!spuId.value) {
            return { list: [], total: 0 };
          }
          const spu = await getSpu(spuId.value);
          return {
            list: spu.skus || [],
            total: spu.skus?.length || 0,
          };
        },
      },
    },
  },
  gridEvents: {
    radioChange: () => {
      const selectedRow = gridApi.grid.getRadioRecord() as MallSpuApi.Sku;
      if (selectedRow) {
        emit('change', selectedRow);
        // 关闭弹窗
        visible.value = false;
        gridApi.grid.clearRadioRow();
        spuId.value = undefined;
      }
    },
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
  // TODO @puhui999：看看注释的部分，后续要不要删除
  // // 等待弹窗和 Grid 组件完全渲染后再查询数据
  // await nextTick();
  // if (gridApi.grid) {
  //   await gridApi.query();
  // }
}

/** 对外暴露的方法 */
defineExpose({
  open: openModal,
});
</script>

<template>
  <Modal
    v-model:open="visible"
    title="选择规格"
    width="700px"
    :destroy-on-close="true"
    :footer="null"
    @cancel="closeModal"
  >
    <Grid />
  </Modal>
</template>
