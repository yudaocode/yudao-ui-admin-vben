<script lang="ts" setup>
import type { WmsMovementOrderApi } from '#/api/wms/order/movement';
import type { WmsMovementOrderDetailApi } from '#/api/wms/order/movement/detail';

import { computed, nextTick, ref } from 'vue';

import { Barcode, BarcodeFormatEnum } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate, formatDateTime } from '@vben/utils';

import {
  getMovementOrder,
  getMovementOrderDetailListByOrderId,
} from '#/api/wms/order/movement';
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  multiplyPrice,
} from '#/views/wms/utils/format';

interface PrintRow extends WmsMovementOrderDetailApi.MovementOrderDetail {
  totalPrice?: number;
}

defineOptions({ name: 'WmsMovementOrderPrint' });

const printData = ref<WmsMovementOrderApi.MovementOrder>({});
const tableColumnCount = 5;

const printRows = computed<PrintRow[]>(() =>
  (printData.value.details || []).map((detail) => ({
    ...detail,
    totalPrice:
      detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price),
  })),
);

/** 等待条码和打印 DOM 完成绘制，避免浏览器打印到旧内容 */
function waitForPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** 退出打印模式，恢复当前页面显示 */
function removePrintMode() {
  document.body.classList.remove('wms-movement-order-printing');
}

/** 获取打印用字典文案，空值统一显示为横杠 */
function getPrintDictLabel(dictType: string, value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return getDictLabel(dictType, value) || '-';
}

/** 打印移库单：加载数据后只展示打印区域，再调用浏览器打印 */
async function print(id: number) {
  const order = await getMovementOrder(id);
  const details =
    order.details || (await getMovementOrderDetailListByOrderId(id));
  printData.value = { ...order, details };
  await nextTick();
  await waitForPaint();
  document.body.classList.add('wms-movement-order-printing');
  window.addEventListener('afterprint', removePrintMode, { once: true });
  window.print();
}

defineExpose({ print });
</script>

<template>
  <Teleport to="body">
    <div
      id="wmsMovementOrderPrint"
      class="wms-movement-order-print pointer-events-none fixed left-0 top-0 z-[-1] w-full bg-white text-[#303133] opacity-0"
    >
      <div class="relative mb-2">
        <h2 class="m-0 text-center text-[1.5em] font-bold leading-[1.2]">
          移库单
        </h2>
        <div v-if="printData.no" class="absolute right-0 top-0">
          <Barcode
            :content="printData.no"
            :display-value="false"
            :format="BarcodeFormatEnum.CODE39"
            :height="40"
            :width="180"
          />
        </div>
      </div>
      <div class="mb-3 grid grid-cols-3 gap-x-6 gap-y-2 text-sm leading-[1.5]">
        <div>移库单号：{{ printData.no || '-' }}</div>
        <div>来源仓库：{{ printData.sourceWarehouseName || '-' }}</div>
        <div>目标仓库：{{ printData.targetWarehouseName || '-' }}</div>
        <div>
          移库状态：{{
            getPrintDictLabel(DICT_TYPE.WMS_ORDER_STATUS, printData.status)
          }}
        </div>
        <div>
          单据日期：{{ formatDate(printData.orderTime, 'YYYY-MM-DD') || '-' }}
        </div>
        <div>总数量：{{ formatQuantity(printData.totalQuantity) || '-' }}</div>
        <div>总金额：{{ formatPrice(printData.totalPrice) || '-' }}</div>
        <div class="col-span-3 grid grid-cols-2 gap-x-6">
          <div>
            创建：{{ formatDateTime(printData.createTime) || '-' }} /
            {{ printData.creatorName || printData.creator || '-' }}
          </div>
          <div>
            更新：{{ formatDateTime(printData.updateTime) || '-' }} /
            {{ printData.updaterName || printData.updater || '-' }}
          </div>
        </div>
        <div class="col-span-3">备注：{{ printData.remark || '-' }}</div>
      </div>
      <table class="w-full border-collapse text-[13px] leading-[1.5]">
        <thead>
          <tr>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              商品信息
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              规格信息
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              数量
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              单价(元)
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              金额(元)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="detail in printRows" :key="detail.id || detail.skuId">
            <td class="border border-solid border-[#dcdfe6] p-2">
              <div>{{ detail.itemName || '-' }}</div>
              <div v-if="detail.itemCode" class="text-xs">
                编号：{{ detail.itemCode }}
              </div>
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2">
              <div>{{ detail.skuName || '-' }}</div>
              <div v-if="detail.skuCode" class="text-xs">
                编号：{{ detail.skuCode }}
              </div>
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2 text-right">
              {{ formatQuantity(detail.quantity) || '-' }}
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2 text-right">
              {{ formatPrice(detail.price) || '-' }}
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2 text-right">
              {{ formatPrice(detail.totalPrice) || '-' }}
            </td>
          </tr>
          <tr v-if="printRows.length > 0">
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2"
              colspan="2"
            >
              合计
            </td>
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-right"
            >
              {{ formatSumQuantity(printRows, (detail) => detail.quantity) }}
            </td>
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-right"
            ></td>
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-right"
            >
              {{ formatSumPrice(printRows, (detail) => detail.totalPrice) }}
            </td>
          </tr>
          <tr v-if="printRows.length === 0">
            <td
              class="border border-solid border-[#dcdfe6] p-2 text-center"
              :colspan="tableColumnCount"
            >
              暂无明细
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </Teleport>
</template>

<style scoped>
@page {
  margin: 8mm 10mm;
}

@media print {
  :global(body.wms-movement-order-printing) {
    padding: 0 !important;
    margin: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  :global(body.wms-movement-order-printing *) {
    visibility: hidden !important;
  }

  :global(body.wms-movement-order-printing .wms-movement-order-print),
  :global(body.wms-movement-order-printing .wms-movement-order-print *) {
    visibility: visible !important;
  }

  :global(body.wms-movement-order-printing .wms-movement-order-print) {
    position: absolute;
    top: 0;
    left: 0;
    z-index: auto;
    box-sizing: border-box;
    width: 100%;
    padding: 0 !important;
    margin: 0 !important;
    pointer-events: auto;
    opacity: 1;
  }
}
</style>
