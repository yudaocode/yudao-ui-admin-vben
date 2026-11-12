<script lang="ts" setup>
import type { AiPptApi } from '#/api/ai/ppt';

import { computed } from 'vue';

import { AiPptStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElImage } from 'element-plus';

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
    class="relative aspect-video w-full overflow-hidden bg-[var(--el-fill-color-light)]"
  >
    <template v-if="slide.imageUrl">
      <ElImage
        :src="slide.imageUrl"
        fit="contain"
        class="size-full"
        :preview-src-list="preview ? [slide.imageUrl] : undefined"
        preview-teleported
      />
      <div
        v-if="slideRunning"
        class="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white"
      >
        本页重绘中…
      </div>
    </template>
    <div
      v-else
      class="flex size-full items-center justify-center gap-1 text-xs text-[var(--el-text-color-secondary)]"
    >
      <IconifyIcon
        v-if="slideRunning"
        icon="ep:loading"
        class="animate-spin text-[var(--el-color-primary)]"
      />
      {{ slideRunning ? '生成中…' : running ? '待生成' : '本页未生成配图' }}
    </div>
  </div>
</template>
