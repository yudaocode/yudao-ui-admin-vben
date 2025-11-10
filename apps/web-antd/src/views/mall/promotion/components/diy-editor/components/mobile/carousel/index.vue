<script setup lang="ts">
import type { CarouselProperty } from './config';

import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Carousel, Image } from 'ant-design-vue';

/** 轮播图 */
defineOptions({ name: 'Carousel' });

defineProps<{ property: CarouselProperty }>();

const currentIndex = ref(0); // 当前索引

/** 处理索引变化 */
const handleIndexChange = (index: number) => {
  currentIndex.value = index + 1;
};
</script>
<template>
  <!-- 无图片 -->
  <div
    class="bg-card flex h-64 items-center justify-center"
    v-if="property.items.length === 0"
  >
    <IconifyIcon icon="tdesign:image" class="size-6 text-gray-800" />
  </div>
  <div v-else class="relative">
    <Carousel
      :autoplay="property.autoplay"
      :autoplay-speed="property.interval * 1000"
      :dots="property.indicator !== 'number'"
      @change="handleIndexChange"
      class="h-44"
    >
      <div v-for="(item, index) in property.items" :key="index">
        <Image
          class="h-full w-full object-cover"
          :src="item.imgUrl"
          :preview="false"
        />
      </div>
    </Carousel>
    <div
      v-if="property.indicator === 'number'"
      class="absolute bottom-2.5 right-2.5 rounded-xl bg-black px-2 py-1 text-xs text-white opacity-40"
    >
      {{ currentIndex }} / {{ property.items.length }}
    </div>
  </div>
</template>
