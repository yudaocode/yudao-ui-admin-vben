<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallOrderApi } from '#/api/mall/trade/order';

import { h, onMounted, ref } from 'vue';

import { Page, prompt } from '@vben/common-ui';
import { fenToYuan } from '@vben/utils';

import { ElCard, ElInput, ElMessage } from 'element-plus';

import { TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getOrderByPickUpVerifyCode,
  getOrderPage,
  getOrderSummary,
} from '#/api/mall/trade/order';
import { SummaryCard } from '#/components/summary-card';
import { DeliveryTypeEnum, TradeOrderStatusEnum } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';

const summary = ref<MallOrderApi.OrderSummary>();

async function getOrderSum() {
  const query = await gridApi.formApi.getValues();
  query.deliveryType = DeliveryTypeEnum.PICK_UP.type;
  const res = await getOrderSummary(query as any);
  summary.value = res;
}

/** 核销 */
async function handlePickup(pickUpVerifyCode?: string) {
  if (!pickUpVerifyCode) {
    await prompt({
      component: () => {
        return h(ElInput, {});
      },
      content: '请输入核销码',
      title: '核销订单',
      modelPropName: 'value',
    }).then(async (val) => {
      if (val) {
        pickUpVerifyCode = val;
      }
    });
  }
  if (!pickUpVerifyCode) {
    return;
  }
  const data = await getOrderByPickUpVerifyCode(pickUpVerifyCode);
  if (data?.deliveryType !== DeliveryTypeEnum.PICK_UP.type) {
    ElMessage.error('未查询到订单');
    return;
  }
  if (data?.status !== TradeOrderStatusEnum.UNDELIVERED.status) {
    ElMessage.error('订单不是待核销状态');
  }
}

const port = ref('');
const ports = ref([]);
const reader = ref('');
const serialPort = ref(false); // 是否连接扫码枪

/** 连接扫码枪 */
async function connectToSerialPort() {
  try {
    // 判断浏览器支持串口通信
    if (
      'serial' in navigator &&
      navigator.serial !== null &&
      typeof navigator.serial === 'object' &&
      'requestPort' in navigator.serial
    ) {
      // 提示用户选择一个串口
      port.value = await (navigator.serial as any).requestPort();
    } else {
      ElMessage.error('浏览器不支持扫码枪连接，请更换浏览器重试');
      return;
    }

    // 获取用户之前授予该网站访问权限的所有串口。
    ports.value = await (navigator.serial as any).getPorts();

    // 等待串口打开
    await (port.value as any).open({
      baudRate: 9600,
      dataBits: 8,
      stopBits: 2,
    });

    ElMessage.success('成功连接扫码枪');
    serialPort.value = true;
    readData();
  } catch (error) {
    // 处理连接串口出错的情况
    console.error('Error connecting to serial port:', error);
  }
}

/** 监听扫码枪输入 */
async function readData() {
  reader.value = (port.value as any).readable.getReader();
  let data = ''; // 扫码数据
  // 监听来自串口的数据
  while (true) {
    const { value, done } = await (reader.value as any).read();
    if (done) {
      // 允许稍后关闭串口
      (reader.value as any).releaseLock();
      break;
    }
    // 获取发送的数据
    const serialData = new TextDecoder().decode(value);
    data = `${data}${serialData}`;
    if (serialData.includes('\r')) {
      // 读取结束
      const codeData = data.replace('\r', '');
      data = ''; // 清空下次读取不会叠加
      console.warn(`二维码数据:${codeData}`);
      // 处理拿到数据逻辑
      handlePickup(codeData);
    }
  }
}

async function cutPort() {
  if (port.value === '') {
    ElMessage.warning('请先连接或打开扫码枪');
  } else {
    await (reader.value as any).cancel();
    await (port.value as any).close();
    port.value = '';
    console.warn('断开扫码枪连接');
    ElMessage.success('已成功断开扫码枪连接');
    serialPort.value = false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            deliveryType: DeliveryTypeEnum.PICK_UP.type,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MallOrderApi.Order>,
});

onMounted(() => {
  getOrderSum();
});
</script>

<template>
  <Page auto-content-height>
    <ElCard class="mb-4 h-[10%]">
      <div class="flex flex-row gap-4">
        <SummaryCard
          class="flex flex-1"
          title="订单数量"
          icon="icon-park-outline:transaction-order"
          icon-color="bg-blue-100"
          icon-bg-color="text-blue-500"
          :value="summary?.orderCount || 0"
        />
        <SummaryCard
          class="flex flex-1"
          title="订单金额"
          icon="streamline:money-cash-file-dollar-common-money-currency-cash-file"
          icon-color="bg-purple-100"
          icon-bg-color="text-purple-500"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(summary?.orderPayPrice || 0))"
        />
        <SummaryCard
          class="flex flex-1"
          title="退款单数"
          icon="heroicons:receipt-refund"
          icon-color="bg-yellow-100"
          icon-bg-color="text-yellow-500"
          :value="summary?.afterSaleCount || 0"
        />
        <SummaryCard
          class="flex flex-1"
          title="退款金额"
          icon="ri:refund-2-line"
          icon-color="bg-green-100"
          icon-bg-color="text-green-500"
          prefix="￥"
          :decimals="2"
          :value="Number(fenToYuan(summary?.afterSalePrice || 0))"
        />
      </div>
    </ElCard>
    <Grid class="h-4/5" table-title="核销订单">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '核销',
              type: 'primary',
              icon: 'lucide:circle-check-big',
              auth: ['trade:order:pick-up'],
              onClick: handlePickup.bind(null, undefined),
            },
            {
              label: serialPort ? '断开扫描枪' : '连接扫描枪',
              type: 'primary',
              icon: serialPort ? 'lucide:circle-x' : 'lucide:circle-play',
              link: true,
              onClick: serialPort ? cutPort : connectToSerialPort,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
