<script lang="ts" setup>
import type { WmsShipmentOrderApi } from '#/api/wms/order/shipment';
import type { WmsShipmentOrderDetailApi } from '#/api/wms/order/shipment/detail';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { VxeColumn, VxeTable } from '#/adapter/vxe-table';
import {
  getShipmentOrder,
  getShipmentOrderDetailListByOrderId,
} from '#/api/wms/order/shipment';
import { useDescription } from '#/components/description';
import {
  formatPrice,
  formatQuantity,
  multiplyPrice,
} from '#/views/wms/utils/format';

import { getDetailFooter, useDetailSchema } from '../data';

interface DetailRow extends WmsShipmentOrderDetailApi.ShipmentOrderDetail {
  totalPrice?: number;
}

defineOptions({ name: 'WmsShipmentOrderDetail' });

const detailData = ref<WmsShipmentOrderApi.ShipmentOrder>({});

const detailRows = computed<DetailRow[]>(() =>
  (detailData.value.details || []).map((detail) => ({
    ...detail,
    totalPrice:
      detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
  })),
);

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
  useCard: false,
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
      const order = await getShipmentOrder(data.id);
      const details =
        order.details || (await getShipmentOrderDetailListByOrderId(data.id));
      detailData.value = { ...order, details };
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="出库单详情"
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
        <VxeColumn field="unit" title="单位" align="center" width="100" />
        <VxeColumn title="单价" align="right" width="140">
          <template #default="{ row }">
            {{ formatPrice(row.price) || '-' }}
          </template>
        </VxeColumn>
        <VxeColumn field="totalPrice" title="总价" align="right" width="140">
          <template #default="{ row }">
            {{ formatPrice(row.totalPrice) || '-' }}
          </template>
        </VxeColumn>
      </VxeTable>
    </div>
  </Modal>
</template>
