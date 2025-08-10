<script setup lang="ts">
import type { MenuListProperty } from './config';

import { IconifyIcon } from '@vben/icons';

import { ElImage } from 'element-plus';

/** 列表导航 */
defineOptions({ name: 'MenuList' });
defineProps<{ property: MenuListProperty }>();
</script>

<template>
  <div class="min-h-[42px] flex flex-col">
    <div
      v-for="(item, index) in property.list"
      :key="index"
      class="item h-[42px] gap-1 px-3 flex flex-row items-center justify-between"
    >
              <div class="gap-2 flex flex-1 flex-row items-center">
        <ElImage
          v-if="item.iconUrl"
          class="h-4 w-4"
          :src="item.iconUrl"
        />
        <span class="text-base" :style="{ color: item.titleColor }">{{
          item.title
        }}</span>
      </div>
              <div class="item-center gap-1 flex flex-row justify-center">
        <span class="text-xs" :style="{ color: item.subtitleColor }">{{
          item.subtitle
        }}</span>
        <IconifyIcon icon="ep:arrow-right" color="#000" :size="16" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.item + .item {
  border-top: 1px solid #eee;
}
</style>
