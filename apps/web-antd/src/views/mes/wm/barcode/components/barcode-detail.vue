<script lang="ts" setup>
import type Barcode from './barcode.vue';

import type { MesWmBarcodeApi } from '#/api/mes/wm/barcode';

import { ref } from 'vue';

import { Button, Empty, message, Modal, Tooltip } from 'ant-design-vue';

import { createBarcode, getBarcodeByBusiness } from '#/api/mes/wm/barcode';
import { useDescription } from '#/components/description';

import { useBarcodeDetailSchema } from '../data';
import MesWmBarcode from './barcode.vue';

defineOptions({ name: 'MesWmBarcodeDetail' });

const open = ref(false);
const barcodeRef = ref<InstanceType<typeof Barcode>>();
const barcodeData = ref<Partial<MesWmBarcodeApi.Barcode>>({});

const [Descriptions] = useDescription({
  bordered: true,
  column: 1,
  schema: useBarcodeDetailSchema(),
  useCard: false,
});

function openModal(row: Partial<MesWmBarcodeApi.Barcode>) {
  open.value = true;
  barcodeData.value = { ...row };
}

async function openByBusiness(
  bizId: number,
  bizType: number,
  bizCode?: string,
  bizName?: string,
) {
  open.value = true;
  try {
    const data = await getBarcodeByBusiness(bizType, bizId);
    barcodeData.value = data || {
      bizCode,
      bizId,
      bizName,
      bizType,
      content: '',
    };
    if (!data) {
      message.warning('未找到对应条码数据');
    }
  } catch {
    barcodeData.value = { bizCode, bizId, bizName, bizType, content: '' };
    message.error('加载条码数据失败');
  }
}

defineExpose({ open: openModal, openByBusiness });

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function handlePrint() {
  const base64 = barcodeRef.value?.getImageBase64();
  if (!base64) {
    message.warning('条码生成失败，无法打印');
    return;
  }
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    message.error('无法打开打印窗口，请检查浏览器设置');
    return;
  }
  printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>打印条码</title>
<style>*{margin:0;padding:0}body{font-family:Arial,sans-serif;padding:20px}.print-container{text-align:center}.barcode-img{max-width:100%;margin:20px 0}.info{margin-top:20px;text-align:left;font-size:12px}.info p{margin:5px 0}@media print{body{padding:0}.print-container{padding:20px}}</style>
</head><body><div class="print-container">
<img src="${base64}" class="barcode-img" alt="条码" />
<div class="info">
<p><strong>业务编码:</strong> ${escapeHtml(barcodeData.value.bizCode || '')}</p>
<p><strong>业务名称:</strong> ${escapeHtml(barcodeData.value.bizName || '')}</p>
<p><strong>条码内容:</strong> ${escapeHtml(barcodeData.value.content || '')}</p>
</div></div></body></html>`);
  printWindow.document.close();
  printWindow.addEventListener('load', () => {
    setTimeout(() => printWindow.print(), 500);
  });
}

function handleDownload() {
  const base64 = barcodeRef.value?.getImageBase64();
  if (!base64) {
    message.warning('条码生成失败，无法下载');
    return;
  }
  const link = document.createElement('a');
  link.href = base64;
  link.download = `barcode_${barcodeData.value.bizCode || 'unknown'}_${Date.now()}.png`;
  link.click();
  message.success('下载成功');
}

async function handleGenerate() {
  const { bizCode, bizId, bizName, bizType } = barcodeData.value;
  if (!bizType || !bizId) {
    message.warning('缺少业务类型或业务编号，无法生成条码');
    return;
  }
  await createBarcode({
    bizCode: bizCode || '',
    bizId,
    bizName: bizName || '',
    bizType,
  });
  message.success('条码生成成功');
  const data = await getBarcodeByBusiness(bizType, bizId);
  if (data) {
    barcodeData.value = { ...data };
  }
}
</script>

<template>
  <Modal v-model:open="open" title="查看条码" width="500px">
    <div>
      <div
        class="mb-5 flex min-h-50 items-center justify-center rounded bg-gray-100 p-5"
      >
        <div
          v-if="barcodeData.content"
          class="flex items-center justify-center"
        >
          <MesWmBarcode
            ref="barcodeRef"
            :content="barcodeData.content"
            :format="barcodeData.format"
            :height="150"
            :width="400"
          />
        </div>
        <Empty v-else description="暂无条码数据" />
      </div>
      <Descriptions :data="barcodeData">
        <template #content>
          <Tooltip :title="barcodeData.content">
            <span
              class="inline-block max-w-75 overflow-hidden text-ellipsis whitespace-nowrap"
            >
              {{ barcodeData.content }}
            </span>
          </Tooltip>
        </template>
      </Descriptions>
    </div>
    <template #footer>
      <Button v-if="!barcodeData.content" @click="handleGenerate">
        生成
      </Button>
      <Button type="primary" @click="handlePrint">打印</Button>
      <Button @click="handleDownload">下载</Button>
      <Button @click="open = false">关闭</Button>
    </template>
  </Modal>
</template>
