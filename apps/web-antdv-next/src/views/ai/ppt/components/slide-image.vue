<script lang="ts" setup>
import type { AiPptApi } from '#/api/ai/ppt';

import { computed } from 'vue';

import { AiPptStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Image } from 'antdv-next';

/** AI PPT：一页的图。有图显示图（重绘中叠加提示）；没图按状态显示占位 */
defineOptions({ name: 'AiPptSlideImage' });

const props = withDefaults(
  defineProps<{
    preview?: boolean; // 是否可点击放大
    running?: boolean; // 任务是否生成中
    slide: AiPptApi.Slide;
  }>(),
  { preview: false, running: false },
);

/** 本页是否在生成：任务结束后（例如超时），本页残留的生成中不再显示 */
const slideRunning = computed(
  () => props.running && props.slide.status === AiPptStatusEnum.IN_PROGRESS,
);
</script>

<template>
  <div
    class="relative aspect-video w-full overflow-hidden bg-gray-100 dark:bg-gray-800"
  >
    <template v-if="slide.imageUrl">
      <Image
        v-if="preview"
        :src="slide.imageUrl"
        width="100%"
        height="100%"
        :style="{ objectFit: 'contain' }"
        :wrapper-style="{ width: '100%', height: '100%' }"
      />
      <img v-else :src="slide.imageUrl" class="size-full object-contain" />
      <div
        v-if="slideRunning"
        class="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white"
      >
        本页重绘中…
      </div>
    </template>
    <div
      v-else
      class="flex size-full items-center justify-center gap-1 text-xs text-gray-500"
    >
      <IconifyIcon
        v-if="slideRunning"
        icon="lucide:loader-circle"
        class="animate-spin text-primary"
      />
      {{ slideRunning ? '生成中…' : running ? '待生成' : '本页未生成配图' }}
    </div>
  </div>
</template>
