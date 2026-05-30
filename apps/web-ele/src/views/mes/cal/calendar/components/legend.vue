<script lang="ts" setup>
import { ElTag } from 'element-plus';

/** 配色说明项：色块 + 文案 */
const legendItems: Array<{ color: string; label: string }> = [
  { color: 'bg-[#95d475]', label: '白班' },
  { color: 'bg-[#f0a020]', label: '中班（三班倒）' },
  { color: 'bg-[#909399]', label: '中班（两班倒）/ 夜班' },
];
</script>

<template>
  <div
    class="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 px-1 py-2 text-xs"
  >
    <span class="shrink-0">配色说明：</span>
    <span
      v-for="item in legendItems"
      :key="item.label"
      class="flex items-center gap-1"
    >
      <span
        class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
        :class="item.color"
      ></span>
      {{ item.label }}
    </span>
    <span class="flex items-center gap-1">
      <span class="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-[#f56c6c] opacity-60"></span>
      <span class="text-red-500">红色日期</span>
      = 周末
    </span>
    <span class="flex items-center gap-1">
      <ElTag effect="dark" size="small" type="success"> 休 </ElTag>
      = 节假日（不显示排班）
    </span>
  </div>
</template>
