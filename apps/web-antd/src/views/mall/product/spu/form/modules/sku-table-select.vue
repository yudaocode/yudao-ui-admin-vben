<!-- SKU 选择弹窗组件 -->
<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { MallSpuApi } from '#/api/mall/product/spu';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { fenToYuan } from '@vben/utils';

import { Input, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSpu } from '#/api/mall/product/spu';

interface SpuData {
  spuId: number;
}

const emit = defineEmits<{
  change: [sku: MallSpuApi.Sku];
}>();

const selectedSkuId = ref<number>();
const spuId = ref<number>();

/** 配置列 */
// TODO @puhui999：貌似列太宽了？
const gridColumns = computed<VxeGridProps['columns']>(() => [
  {
    field: 'id',
    title: '#',
    width: 60,
    align: 'center',
    slots: { default: 'radio-column' },
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
]);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: gridColumns.value,
    height: 400,
    border: true,
    showOverflow: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!spuId.value) {
            return { items: [], total: 0 };
          }
          try {
            const spu = await getSpu(spuId.value);
            return {
              items: spu.skus || [],
              total: spu.skus?.length || 0,
            };
          } catch (error) {
            message.error('加载 SKU 数据失败');
            console.error(error);
            return { items: [], total: 0 };
          }
        },
      },
    },
  },
});

/** 处理选中 */
function handleSelected(row: MallSpuApi.Sku) {
  emit('change', row);
  modalApi.close();
  selectedSkuId.value = undefined;
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      selectedSkuId.value = undefined;
      spuId.value = undefined;
      return;
    }
    const data = modalApi.getData<SpuData>();
    // TODO @puhui999：这里要不 if return，让括号的层级简单点。
    if (data?.spuId) {
      spuId.value = data.spuId;
      // 触发数据查询
      await gridApi.query();
    }
  },
});
</script>

<template>
  <Modal class="w-[700px]" title="选择规格">
    <Grid>
      <template #radio-column="{ row }">
        <Input
          v-model="selectedSkuId"
          :value="row.id"
          class="cursor-pointer"
          type="radio"
          @change="handleSelected(row)"
        />
      </template>
    </Grid>
  </Modal>
</template>
