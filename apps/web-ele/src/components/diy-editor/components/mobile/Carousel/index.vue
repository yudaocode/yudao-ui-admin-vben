<script setup lang="ts">
import type { CarouselProperty } from './config';

import { ref } from 'vue';

/** 轮播图 */
defineOptions({ name: 'Carousel' });

defineProps<{ property: CarouselProperty }>();

const currentIndex = ref(0);
const handleIndexChange = (index: number) => {
  currentIndex.value = index + 1;
};
</script>
<template>
  <!-- 无图片 -->
  <div
    class="h-250px bg-gray-3 flex items-center justify-center"
    v-if="property.items.length === 0"
  >
    <Icon icon="tdesign:image" class="text-gray-8 text-120px!" />
  </div>
  <div v-else class="relative">
    <el-carousel
      height="174px"
      :type="property.type === 'card' ? 'card' : ''"
      :autoplay="property.autoplay"
      :interval="property.interval * 1000"
      :indicator-position="property.indicator === 'number' ? 'none' : undefined"
      @change="handleIndexChange"
    >
      <el-carousel-item v-for="(item, index) in property.items" :key="index">
        <el-image class="h-full w-full" :src="item.imgUrl" />
      </el-carousel-item>
    </el-carousel>
    <div
      v-if="property.indicator === 'number'"
      class="bottom-10px right-10px p-x-8px p-y-2px text-10px absolute rounded-xl bg-black text-white opacity-40"
    >
      {{ currentIndex }} / {{ property.items.length }}
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
