<script lang="ts" setup>
import { formatTokenCount } from '#/views/ai/utils/format';

defineProps<{
  inputTokens?: null | number; // 输入 Token，未知为 null
  outputTokens?: null | number; // 输出 Token，未知为 null
  totalTokens?: null | number; // 合计 Token，未知为 null
}>();
</script>

<template>
  <div
    class="flex items-center gap-2 text-xs font-normal text-muted-foreground"
  >
    <span>输入 Token {{ formatTokenCount(inputTokens) }}</span>
    <span>输出 Token {{ formatTokenCount(outputTokens) }}</span>
    <span>合计 Token {{ formatTokenCount(totalTokens) }}</span>
  </div>
</template>
