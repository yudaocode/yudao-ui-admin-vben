<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmItemReceiptApi } from '#/api/mes/wm/itemreceipt';
import type { MesWmItemReceiptLineApi } from '#/api/mes/wm/itemreceipt/line';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getItemReceipt } from '#/api/mes/wm/itemreceipt';
import { getItemReceiptLinePage } from '#/api/mes/wm/itemreceipt/line';

const loading = ref(false); // 详情加载状态
const receiptId = ref<number>(); // 当前采购入库单编号
const receipt = ref<MesWmItemReceiptApi.ItemReceipt>(); // 当前采购入库单详情

/** 格式化空值 */
function formatEmpty(value: null | number | string | undefined) {
  return value ?? '-';
}

/** 格式化日期 */
function formatDate(value: Date | number | string | undefined) {
  return value ? (formatDateTime(value) as string) : '-';
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        field: 'itemCode',
        title: '物料编码',
        width: 140,
      },
      {
        field: 'itemName',
        title: '物料名称',
        minWidth: 150,
      },
      {
        field: 'specification',
        title: '规格型号',
        minWidth: 140,
      },
      {
        field: 'unitMeasureName',
        title: '单位',
        width: 100,
      },
      {
        field: 'receivedQuantity',
        title: '入库数量',
        width: 120,
      },
      {
        field: 'batchCode',
        title: '批次号',
        minWidth: 140,
      },
    ],
    height: 280,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!receiptId.value) {
            return { list: [], total: 0 };
          }
          return await getItemReceiptLinePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            receiptId: receiptId.value,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MesWmItemReceiptLineApi.ItemReceiptLine>,
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      receiptId.value = undefined;
      receipt.value = undefined;
      return;
    }
    const data = modalApi.getData<{ id?: number }>();
    if (!data?.id) {
      return;
    }
    receiptId.value = data.id;
    loading.value = true;
    modalApi.lock();
    try {
      receipt.value = await getItemReceipt(data.id);
      await nextTick();
      await gridApi.query();
    } finally {
      loading.value = false;
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="采购入库单详情"
    class="w-[900px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <div v-loading="loading">
      <ElDescriptions border size="small" :column="3">
        <ElDescriptionsItem label="入库单编号">
          {{ formatEmpty(receipt?.code) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="入库单名称">
          {{ formatEmpty(receipt?.name) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="入库日期">
          {{ formatDate(receipt?.receiptDate) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="到货通知单">
          {{ formatEmpty(receipt?.noticeCode) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="供应商">
          {{ formatEmpty(receipt?.vendorName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="采购订单号">
          {{ formatEmpty(receipt?.purchaseOrderCode) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="仓库">
          {{ formatEmpty(receipt?.warehouseName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="库区">
          {{ formatEmpty(receipt?.locationName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="库位">
          {{ formatEmpty(receipt?.areaName) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="备注" :span="3">
          {{ formatEmpty(receipt?.remark) }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <div class="mt-4">
        <Grid table-title="入库物料" />
      </div>
    </div>
  </Modal>
</template>
