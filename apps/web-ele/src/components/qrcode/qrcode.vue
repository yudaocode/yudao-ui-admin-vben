<script lang="ts" setup>
import { toRef, watch } from 'vue';

import { useQRCode } from '@vueuse/integrations/useQRCode';

defineOptions({ name: 'Qrcode' });

const props = withDefaults(
  defineProps<{
    text: string;
    width?: number;
  }>(),
  { width: 160 }
);

const emit = defineEmits<{ done: [dataUrl: string] }>();

const qrcode = useQRCode(toRef(props, 'text'), {
  margin: 1,
  width: props.width,
  color: { dark: '#1f2937', light: '#ffffff' },
});

watch(
  qrcode,
  (dataUrl) => {
    if (dataUrl) {
      emit('done', dataUrl);
    }
  },
  { immediate: true }
);
</script>

<template>
  <img :src="qrcode" alt="qrcode" class="h-40 w-40 rounded border border-solid border-gray-200" />
</template>
