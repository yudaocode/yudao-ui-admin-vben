<script lang="ts" setup>
import type { WmsCheckOrderApi } from '#/api/wms/order/check';
import type { WmsCheckOrderDetailApi } from '#/api/wms/order/check/detail';

import { computed, nextTick, ref } from 'vue';

import { Barcode, BarcodeFormatEnum } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { formatDate, formatDateTime } from '@vben/utils';

import {
  getCheckOrder,
  getCheckOrderDetailListByOrderId,
} from '#/api/wms/order/check';
import {
  formatPrice,
  formatQuantity,
  formatSumPrice,
  formatSumQuantity,
  getLossClass,
  sumPrice,
  sumQuantity,
} from '#/views/wms/utils/format';

import {
  getDetailActualPrice,
  getDetailDifferencePrice,
  getDetailDifferenceQuantity,
  getOrderDifferencePrice,
} from '../data';

interface PrintRow extends WmsCheckOrderDetailApi.CheckOrderDetail {
  actualPrice?: number;
  differencePrice?: number;
  differenceQuantity?: number;
}

defineOptions({ name: 'WmsCheckOrderPrint' });

const printData = ref<WmsCheckOrderApi.CheckOrder>({});
const tableColumnCount = 8;

/** 打印明细补齐实际金额和盈亏字段，避免模板重复计算 */
const printRows = computed<PrintRow[]>(() =>
  (printData.value.details || []).map((detail) => ({
    ...detail,
    actualPrice: getDetailActualPrice(detail),
    differencePrice: getDetailDifferencePrice(detail),
    differenceQuantity: getDetailDifferenceQuantity(detail),
  })),
);

/** 打印合计盈亏数量 */
const totalDifferenceQuantity = computed(() =>
  sumQuantity(printRows.value, (detail) => detail.differenceQuantity),
);
/** 打印合计盈亏金额 */
const totalDifferencePrice = computed(() =>
  sumPrice(printRows.value, (detail) => detail.differencePrice),
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
  document.body.classList.remove('wms-check-order-printing');
}

/** 获取打印用字典文案，空值统一显示为横杠 */
function getPrintDictLabel(dictType: string, value?: number) {
  if (value === undefined || value === null) {
    return '-';
  }
  return getDictLabel(dictType, value) || '-';
}

/** 打印盘库单：加载数据后只展示打印区域，再调用浏览器打印 */
async function print(id: number) {
  const order = await getCheckOrder(id);
  const details = order.details || (await getCheckOrderDetailListByOrderId(id));
  printData.value = { ...order, details };
  await nextTick();
  await waitForPaint();
  document.body.classList.add('wms-check-order-printing');
  window.addEventListener('afterprint', removePrintMode, { once: true });
  window.print();
}

defineExpose({ print });
</script>

<template>
  <Teleport to="body">
    <div
      id="wmsCheckOrderPrint"
      class="wms-check-order-print pointer-events-none fixed left-0 top-0 z-[-1] w-full bg-white text-[#303133] opacity-0"
    >
      <div class="relative mb-2">
        <h2 class="m-0 text-center text-[1.5em] font-bold leading-[1.2]">
          盘库单
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
        <div>盘库单号：{{ printData.no || '-' }}</div>
        <div>仓库：{{ printData.warehouseName || '-' }}</div>
        <div>
          盘库状态：{{
            getPrintDictLabel(DICT_TYPE.WMS_ORDER_STATUS, printData.status)
          }}
        </div>
        <div>
          单据日期：{{ formatDate(printData.orderTime, 'YYYY-MM-DD') || '-' }}
        </div>
        <div>
          盈亏数量：
          <span :class="getLossClass(printData.totalQuantity)">
            {{ formatQuantity(printData.totalQuantity) || '-' }}
          </span>
        </div>
        <div>总金额：{{ formatPrice(printData.totalPrice) || '-' }}</div>
        <div>实际金额：{{ formatPrice(printData.actualPrice) || '-' }}</div>
        <div>
          实际盈亏金额：
          <span :class="getLossClass(getOrderDifferencePrice(printData))">
            {{ formatPrice(getOrderDifferencePrice(printData)) || '-' }}
          </span>
        </div>
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
              账面库存
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              单价(元)
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              实际库存
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              实际金额(元)
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              盈亏数
            </th>
            <th
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-left font-bold"
            >
              实际盈亏金额(元)
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
              {{ formatQuantity(detail.checkQuantity) || '-' }}
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2 text-right">
              {{ formatPrice(detail.actualPrice) || '-' }}
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2 text-right">
              <span :class="getLossClass(detail.differenceQuantity)">
                {{ formatQuantity(detail.differenceQuantity) || '-' }}
              </span>
            </td>
            <td class="border border-solid border-[#dcdfe6] p-2 text-right">
              <span :class="getLossClass(detail.differencePrice)">
                {{ formatPrice(detail.differencePrice) || '-' }}
              </span>
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
              {{
                formatSumQuantity(printRows, (detail) => detail.checkQuantity)
              }}
            </td>
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-right"
            >
              {{ formatSumPrice(printRows, (detail) => detail.actualPrice) }}
            </td>
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-right"
            >
              <span :class="getLossClass(totalDifferenceQuantity)">
                {{ formatQuantity(totalDifferenceQuantity) }}
              </span>
            </td>
            <td
              class="border border-solid border-[#dcdfe6] bg-[#f5f7fa] p-2 text-right"
            >
              <span :class="getLossClass(totalDifferencePrice)">
                {{ formatPrice(totalDifferencePrice) }}
              </span>
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
  :global(body.wms-check-order-printing) {
    padding: 0 !important;
    margin: 0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  :global(body.wms-check-order-printing *) {
    visibility: hidden !important;
  }

  :global(body.wms-check-order-printing .wms-check-order-print),
  :global(body.wms-check-order-printing .wms-check-order-print *) {
    visibility: visible !important;
  }

  :global(body.wms-check-order-printing .wms-check-order-print) {
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
