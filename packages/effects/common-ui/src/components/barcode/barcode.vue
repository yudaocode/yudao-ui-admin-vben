<script lang="ts" setup>
import type { QRCodeRenderersOptions } from 'qrcode';

import type { BarcodeFormat } from './types';

import { computed, nextTick, ref, unref, watch } from 'vue';

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

import { BARCODE_FORMAT_MAP, BarcodeFormatEnum } from './types';

defineOptions({ name: 'Barcode' });

const props = withDefaults(
  defineProps<{
    content?: string;
    displayValue?: boolean;
    format?: BarcodeFormat;
    height?: number;
    width?: number;
  }>(),
  {
    content: '',
    displayValue: true,
    format: BarcodeFormatEnum.QR_CODE,
    height: 100,
    width: 200,
  },
);

const emit = defineEmits<{
  done: [base64: string];
}>();

const loading = ref(true);
const canvasRef = ref<HTMLCanvasElement>();
const imgRef = ref<HTMLImageElement>();
const isQRCode = computed(() => props.format === BarcodeFormatEnum.QR_CODE);

const wrapStyle = computed(() => {
  if (isQRCode.value) {
    return {
      height: `${props.width}px`,
      width: `${props.width}px`,
    };
  }
  return {
    width: `${props.width}px`,
  };
});

async function generateQRCode() {
  const canvas = unref(canvasRef);
  if (!canvas) {
    return;
  }
  const options: QRCodeRenderersOptions = {
    errorCorrectionLevel: 'M',
    width: props.width,
  };
  await QRCode.toCanvas(canvas, props.content, options);
  emit('done', canvas.toDataURL());
}

function generateOneDimensionalBarcode() {
  const img = unref(imgRef);
  if (!img) {
    return;
  }
  JsBarcode(img, props.content, {
    displayValue: props.displayValue,
    format: BARCODE_FORMAT_MAP[props.format] || 'CODE39',
    height: props.height,
    margin: 10,
    width: 2,
  });
  emit('done', img.src);
}

async function generateBarcode() {
  if (!props.content) {
    loading.value = false;
    return;
  }

  loading.value = true;
  await nextTick();
  try {
    if (isQRCode.value) {
      await generateQRCode();
      return;
    }
    generateOneDimensionalBarcode();
  } catch (error) {
    console.error('生成条码失败:', error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [
    props.content,
    props.displayValue,
    props.format,
    props.height,
    props.width,
  ],
  () => {
    generateBarcode();
  },
  { immediate: true },
);

function getImageBase64() {
  if (isQRCode.value) {
    return unref(canvasRef)?.toDataURL() || '';
  }
  return unref(imgRef)?.src || '';
}

defineExpose({ getImageBase64 });
</script>

<template>
  <div :aria-busy="loading" class="inline-block" :style="wrapStyle">
    <canvas v-if="isQRCode" ref="canvasRef" class="block max-w-full"></canvas>
    <img v-else ref="imgRef" alt="barcode" class="block max-w-full" />
  </div>
</template>
