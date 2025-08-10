<script setup lang="ts">
import type { NoticeBarProperty } from './config';

import { ElCarousel, ElCarouselItem, ElImage, ElDivider } from 'element-plus';
import { IconifyIcon } from '@vben/icons';

/** 公告栏 */
defineOptions({ name: 'NoticeBar' });

defineProps<{ property: NoticeBarProperty }>();
</script>

<template>
  <div
    class="py-1 text-xs flex items-center"
    :style="{
      backgroundColor: property.backgroundColor,
      color: property.textColor,
    }"
  >
    <ElImage :src="property.iconUrl" class="h-[18px]" />
    <ElDivider direction="vertical" />
    <ElCarousel
      height="24px"
      direction="vertical"
      :autoplay="true"
      class="pr-2 flex-1"
    >
      <ElCarouselItem v-for="(item, index) in property.contents" :key="index">
        <div class="h-6 leading-6 truncate">{{ item.text }}</div>
      </ElCarouselItem>
    </ElCarousel>
    <IconifyIcon icon="ep:arrow-right" />
  </div>
</template>

<style scoped lang="scss"></style>
