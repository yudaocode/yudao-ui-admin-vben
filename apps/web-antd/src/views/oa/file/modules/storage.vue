<script lang="ts" setup>
import type { OaFileNodeApi } from '#/api/oa/file/node';

import { onMounted, ref } from 'vue';

import { formatFileSize } from '@vben/utils';

import { Progress } from 'ant-design-vue';

import { getFileStorage } from '#/api/oa/file/node';

defineOptions({ name: 'OaFileStorage' });

const storage = ref<OaFileNodeApi.FileStorage>(); // 云盘容量与共享统计

/** 查询云盘概览 */
async function getStorage() {
  storage.value = await getFileStorage();
}
defineExpose({ getStorage }); // 文件发生变化时，由列表刷新概览

/** 初始化 */
onMounted(() => {
  getStorage();
});
</script>

<template>
  <div v-if="storage" class="rounded-lg bg-background p-4">
    <div class="mb-3 text-[14px] font-bold leading-5">云盘概览</div>
    <div class="grid grid-cols-2 gap-6 lg:grid-cols-4">
      <div>
        <div class="mb-1 text-[12px] leading-4 text-muted-foreground">我的文件</div>
        <div class="text-[20px] font-bold leading-7">{{ storage.fileCount }}</div>
      </div>
      <div>
        <div class="mb-1 text-[12px] leading-4 text-muted-foreground">我共享的</div>
        <div class="text-[20px] font-bold leading-7">
          {{ storage.sharedCount }}
        </div>
      </div>
      <div>
        <div class="mb-1 text-[12px] leading-4 text-muted-foreground">共享给我的</div>
        <div class="text-[20px] font-bold leading-7">
          {{ storage.receivedCount }}
        </div>
      </div>
      <div>
        <div class="mb-1 text-[12px] leading-4 text-muted-foreground">存储空间</div>
        <div class="flex flex-col gap-2">
          <div class="text-sm leading-5">
            {{ formatFileSize(storage.usedSize) }} /
            {{ formatFileSize(storage.totalSize) }}
          </div>
          <Progress
            class="!m-0 !flex !h-1 !items-center [&>div]:!flex"
            :percent="Math.min(100, (storage.usedSize / storage.totalSize) * 100)"
            :show-info="false"
            :stroke-width="4"
          />
        </div>
      </div>
    </div>
  </div>
</template>
