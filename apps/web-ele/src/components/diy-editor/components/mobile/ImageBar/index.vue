<script setup lang="ts">
import type { ImageBarProperty } from './config';

/** 图片展示 */
defineOptions({ name: 'ImageBar' });

defineProps<{ property: ImageBarProperty }>();
</script>
<template>
  <!-- 无图片 -->
  <div
    class="h-50px bg-gray-3 flex items-center justify-center"
    v-if="!property.imgUrl"
  >
    <Icon icon="ep:picture" class="text-gray-8 text-30px!" />
  </div>
  <el-image class="min-h-30px" v-else :src="property.imgUrl" />
</template>

<style scoped lang="scss">
/* 图片 */
img {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
