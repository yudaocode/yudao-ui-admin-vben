<script setup lang="ts">
import type { ImageBarProperty } from './config';

import { IconifyIcon } from '@vben/icons';

import { Image } from 'ant-design-vue';

/** 图片展示 */
defineOptions({ name: 'ImageBar' });

defineProps<{ property: ImageBarProperty }>();
</script>
<template>
  <!-- 无图片 -->
  <div
    class="flex h-12 items-center justify-center bg-gray-300"
    v-if="!property.imgUrl"
  >
    <IconifyIcon icon="ep:picture" class="text-3xl text-gray-600" />
  </div>
  <Image
    class="block h-full min-h-8 w-full"
    v-else
    :src="property.imgUrl"
    :preview="false"
  />
</template>
