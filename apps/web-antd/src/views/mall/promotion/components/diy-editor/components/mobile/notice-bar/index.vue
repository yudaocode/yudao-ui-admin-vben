<script setup lang="ts">
import type { NoticeBarProperty } from './config';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Divider, Image } from 'ant-design-vue';

/** 公告栏 */
defineOptions({ name: 'NoticeBar' });

const props = defineProps<{ property: NoticeBarProperty }>();

// 自动轮播
const activeIndex = ref(0);
setInterval(() => {
  const contents = props.property.contents || [];
  activeIndex.value = (activeIndex.value + 1) % (contents.length || 1);
}, 3000);
</script>

<template>
  <div
    class="flex items-center py-1 text-xs"
    :style="{
      backgroundColor: property.backgroundColor,
      color: property.textColor,
    }"
  >
    <Image :src="property.iconUrl" class="h-[18px]" :preview="false" />
    <Divider type="vertical" />
    <div class="h-6 flex-1 truncate pr-2 leading-6">
      {{ property.contents?.[activeIndex]?.text }}
    </div>
    <IconifyIcon icon="lucide:arrow-right" />
  </div>
</template>

<style scoped lang="scss"></style>
