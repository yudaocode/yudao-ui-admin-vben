<script lang="ts" setup>
import type { BarcodeFormat } from '@vben/common-ui';

import { computed, ref } from 'vue';

import { BarcodeFormatEnum, Barcode as CommonBarcode } from '@vben/common-ui';

defineOptions({ name: 'MesWmBarcode' });

const props = withDefaults(
  defineProps<{
    content?: string;
    displayValue?: boolean;
    format?: number;
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

const emit = defineEmits<{ done: [value: string] }>();

const barcodeRef = ref<InstanceType<typeof CommonBarcode>>();
const commonFormat = computed<BarcodeFormat>(
  () => (props.format || BarcodeFormatEnum.QR_CODE) as BarcodeFormat,
);

function getImageBase64() {
  return barcodeRef.value?.getImageBase64() || '';
}

defineExpose({ getImageBase64 });
</script>

<template>
  <CommonBarcode
    ref="barcodeRef"
    :content="content"
    :display-value="displayValue"
    :format="commonFormat"
    :height="height"
    :width="width"
    @done="emit('done', $event)"
  />
</template>
