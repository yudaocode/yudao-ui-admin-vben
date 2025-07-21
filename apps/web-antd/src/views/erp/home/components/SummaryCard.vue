<script lang="ts" setup>
import { VbenCountToAnimator } from '@vben/common-ui';

interface Props {
  title: string;
  value?: number;
}

withDefaults(defineProps<Props>(), {
  value: 0,
});
</script>

<template>
  <div class="flex flex-col gap-2 rounded-lg border bg-white p-6 shadow-sm">
    <div class="flex items-center justify-between text-gray-500">
      <span>{{ title }}</span>
    </div>
    <div class="flex flex-row items-baseline justify-between">
      <VbenCountToAnimator
        :end-val="value"
        :decimals="2"
        :duration="500"
        prefix="￥"
        class="text-3xl font-semibold text-gray-900"
      />
    </div>
  </div>
</template>
