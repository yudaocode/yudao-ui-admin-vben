<script lang="ts" setup>
import type { WmsMovementOrderApi } from '#/api/wms/order/movement';
import type { WmsMovementOrderDetailApi } from '#/api/wms/order/movement/detail';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  getMovementOrder,
  getMovementOrderDetailListByOrderId,
} from '#/api/wms/order/movement';
import { useDescription } from '#/components/description';
import {
  formatPrice,
  formatQuantity,
  multiplyPrice,
} from '#/views/wms/utils/format';

import { getDetailFooter, useDetailSchema } from '../data';

interface DetailRow extends WmsMovementOrderDetailApi.MovementOrderDetail {
  totalPrice?: number;
}

defineOptions({ name: 'WmsMovementOrderDetail' });

const detailData = ref<WmsMovementOrderApi.MovementOrder>({});

const detailRows = computed<DetailRow[]>(() =>
  (detailData.value.details || []).map((detail) => ({
    ...detail,
    totalPrice:
      detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
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
      const order = await getMovementOrder(data.id);
      const details =
        order.details || (await getMovementOrderDetailListByOrderId(data.id));
      detailData.value = { ...order, details };
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="移库单详情"
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
        :footer-method="getDetailFooter"
        :show-overflow="true"
        show-footer
        size="small"
      >
        <VxeColumn title="商品信息" min-width="220">
          <template #default="{ row }">
            <div>{{ row.itemName || '-' }}</div>
            <div v-if="row.itemCode" class="text-xs text-gray-500">
              商品编号：{{ row.itemCode }}
            </div>
          </template>
        </VxeColumn>
        <VxeColumn title="规格信息" min-width="220">
          <template #default="{ row }">
            <div>{{ row.skuName || '-' }}</div>
            <div v-if="row.skuCode" class="text-xs text-gray-500">
              规格编号：{{ row.skuCode }}
            </div>
          </template>
        </VxeColumn>
        <VxeColumn field="quantity" title="数量" align="right" width="120">
          <template #default="{ row }">
            {{ formatQuantity(row.quantity) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn title="单价(元)" align="right" width="140">
          <template #default="{ row }">
            {{ formatPrice(row.price) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn
          field="totalPrice"
          title="金额(元)"
          align="right"
          width="140"
        >
          <template #default="{ row }">
            {{ formatPrice(row.totalPrice) || '-' }}
          </template>
        </VxeColumn>
      </VxeTable>
    </div>
  </Modal>
</template>
