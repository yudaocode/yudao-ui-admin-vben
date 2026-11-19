<script lang="ts" setup>
import { AiDramaStatusEnum, isAiDramaRunning } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Image, Tooltip } from 'ant-design-vue';

/** AI 短剧：资产图片，没有图片时按状态显示占位；项目表单与短剧制作管理共用 */
defineOptions({ name: 'AiDramaAssetImage' });

withDefaults(
  defineProps<{
    errorMessage?: string;
    size?: string;
    status?: number;
    url?: string;
  }>(),
  {
    errorMessage: undefined,
    size: '96px',
    status: undefined,
    url: undefined,
  },
);
</script>

<template>
  <div
    :style="{ width: size, height: size }"
    class="overflow-hidden rounded-md"
  >
    <Image
      v-if="url"
      :src="url"
      width="100%"
      height="100%"
      class="object-cover"
      :wrapper-style="{ width: '100%', height: '100%' }"
    />
    <div
      v-else
      class="bg-muted text-muted-foreground flex size-full flex-col items-center justify-center gap-1 text-xs"
    >
      <template v-if="isAiDramaRunning(status)">
        <IconifyIcon icon="lucide:loader-circle" class="size-4 animate-spin" />
        <span>生成中</span>
      </template>
      <Tooltip
        v-else-if="status === AiDramaStatusEnum.FAIL"
        :title="errorMessage || '生成失败'"
        placement="top"
      >
        <span class="text-destructive">生成失败</span>
      </Tooltip>
      <template v-else>
        <IconifyIcon icon="lucide:image" class="size-4" />
        <span>未出图</span>
      </template>
    </div>
  </div>
</template>
