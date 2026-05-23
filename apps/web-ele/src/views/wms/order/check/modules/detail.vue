<script lang="ts" setup>
import type { WmsCheckOrderApi } from '#/api/wms/order/check';
import type { WmsCheckOrderDetailApi } from '#/api/wms/order/check/detail';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  getCheckOrder,
  getCheckOrderDetailListByOrderId,
} from '#/api/wms/order/check';
import { useDescription } from '#/components/description';
import {
  formatPrice,
  formatQuantity,
  getLossClass,
} from '#/views/wms/utils/format';

import {
  getCheckDetailFooter,
  getDetailActualPrice,
  getDetailDifferencePrice,
  getDetailDifferenceQuantity,
  useDetailSchema,
} from '../data';

interface DetailRow extends WmsCheckOrderDetailApi.CheckOrderDetail {
  actualPrice?: number;
  differencePrice?: number;
  differenceQuantity?: number;
}

defineOptions({ name: 'WmsCheckOrderDetail' });

const detailData = ref<WmsCheckOrderApi.CheckOrder>({});

/** 详情明细补齐实际金额和盈亏字段，便于表格与 footer 统一渲染 */
const detailRows = computed<DetailRow[]>(() =>
  (detailData.value.details || []).map((detail) => ({
    ...detail,
    actualPrice: getDetailActualPrice(detail),
    differencePrice: getDetailDifferencePrice(detail),
    differenceQuantity: getDetailDifferenceQuantity(detail),
  })),
);

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detailData.value = {};
      return;
    }
    const data = modalApi.getData<{ id?: number }>();
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      const order = await getCheckOrder(data.id);
      const details =
        order.details || (await getCheckOrderDetailListByOrderId(data.id));
      detailData.value = { ...order, details };
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="盘库单详情"
    class="w-2/3"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <div class="mx-4 space-y-4">
      <Descriptions :data="detailData" />
      <VxeTable
        :data="detailRows"
        border
        empty-text="暂无商品明细"
        :footer-method="getCheckDetailFooter"
        :show-overflow="true"
        show-footer
        size="small"
      >
        <VxeColumn title="商品信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-xs text-gray-500">
              商品编号：{{ row.itemCode }}
            </div>
          </template>
        </VxeColumn>
        <VxeColumn title="规格信息" min-width="200">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-xs text-gray-500">
              规格编号：{{ row.skuCode }}
            </div>
          </template>
        </VxeColumn>
        <VxeColumn field="quantity" title="账面数量" align="right" width="120">
          <template #default="{ row }">
            {{ formatQuantity(row.quantity) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn title="单价(元)" align="right" width="120">
          <template #default="{ row }">
            {{ formatPrice(row.price) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn
          field="checkQuantity"
          title="实盘数量"
          align="right"
          width="120"
        >
          <template #default="{ row }">
            {{ formatQuantity(row.checkQuantity) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn
          field="actualPrice"
          title="实际金额(元)"
          align="right"
          width="140"
        >
          <template #default="{ row }">
            {{ formatPrice(row.actualPrice) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn
          field="differenceQuantity"
          title="盈亏数量"
          align="right"
          width="120"
        >
          <template #default="{ row }">
            <span :class="getLossClass(row.differenceQuantity)">
              {{ formatQuantity(row.differenceQuantity) || '-' }}
            </span>
          </template>
        </VxeColumn>
        <VxeColumn
          field="differencePrice"
          title="实际盈亏金额(元)"
          align="right"
          width="160"
        >
          <template #default="{ row }">
            <span :class="getLossClass(row.differencePrice)">
              {{ formatPrice(row.differencePrice) || '-' }}
            </span>
          </template>
        </VxeColumn>
      </VxeTable>
    </div>
  </Modal>
</template>
