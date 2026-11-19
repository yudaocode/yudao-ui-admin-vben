<script lang="ts" setup>
import type { AiDramaStoryboardApi } from '#/api/ai/drama/storyboard';

import { computed, ref } from 'vue';

import {
  AiDramaStatusEnum,
  DICT_TYPE,
  isAiDramaRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import {
  ElAlert,
  ElButton,
  ElDialog,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
} from 'element-plus';

import { DictTag } from '#/components/dict-tag';

/** AI 短剧：单镜的视频结果，在镜头内原位播放；「放大观看」在弹窗中放大同一视频，关闭后回到原镜头 */
defineOptions({ name: 'AiDramaShotVideoResult' });

const props = defineProps<{
  modelText?: string; // 本镜使用的视频模型
  storyboard: AiDramaStoryboardApi.Storyboard;
}>();
/** command：更多中的操作，submission 提交记录、voice 镜头声音、importVideo 导入视频、material 素材成片 */
const emit = defineEmits<{ command: [command: string] }>();

const videoRef = ref<HTMLVideoElement>();
const zoomVisible = ref(false); // 放大观看
const running = computed(() => isAiDramaRunning(props.storyboard.videoStatus));

/** 放大观看：暂停原位播放，避免两处同时出声 */
function handleZoom() {
  videoRef.value?.pause();
  zoomVisible.value = true;
}

/** 下载镜头视频 */
function handleDownload() {
  window.open(props.storyboard.videoUrl, '_blank');
}

/** 更多中的操作 */
function handleCommand(command: number | string) {
  emit('command', String(command));
}
</script>

<template>
  <div>
    <div class="mb-2 flex flex-wrap items-center gap-2">
      <span class="text-sm font-medium">视频结果</span>
      <DictTag
        v-if="storyboard.videoStatus"
        :type="DICT_TYPE.AI_DRAMA_STATUS"
        :value="storyboard.videoStatus"
      />
      <span v-else class="text-muted-foreground text-xs">未生成</span>
      <span v-if="modelText" class="text-muted-foreground text-xs">
        本镜模型 {{ modelText }}
      </span>
    </div>
    <!-- 重新生成时保留上次的视频，同时展示本次的状态与失败原因 -->
    <video
      v-if="storyboard.videoUrl"
      ref="videoRef"
      :key="storyboard.videoUrl"
      :src="storyboard.videoUrl"
      controls
      preload="metadata"
      class="block max-h-[480px] w-full rounded-md bg-black"
    ></video>
    <div
      v-else-if="isAiDramaRunning(storyboard.videoStatus)"
      class="bg-muted text-muted-foreground flex h-[120px] items-center justify-center gap-1.5 rounded-md text-xs"
    >
      <IconifyIcon icon="lucide:loader-circle" class="animate-spin" />
      生成中，完成后自动刷新
    </div>
    <ElAlert
      v-if="storyboard.videoStatus === AiDramaStatusEnum.FAIL"
      type="error"
      show-icon
      :closable="false"
      class="mt-2"
      :title="storyboard.errorMessage || '生成失败'"
    />
    <div class="mt-2 flex items-center justify-end gap-1">
      <ElButton
        v-if="storyboard.videoUrl"
        type="primary"
        link
        @click="handleZoom"
      >
        <IconifyIcon icon="lucide:maximize" class="mr-1 inline" />
        放大观看
      </ElButton>
      <ElButton
        v-if="storyboard.videoUrl"
        type="primary"
        link
        @click="handleDownload"
      >
        下载
      </ElButton>
      <ElDropdown trigger="click" @command="handleCommand">
        <ElButton type="primary" link>
          更多
          <IconifyIcon icon="lucide:chevron-down" class="ml-0.5 inline" />
        </ElButton>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem command="submission">提交记录</ElDropdownItem>
            <ElDropdownItem command="voice">镜头声音</ElDropdownItem>
            <ElDropdownItem command="importVideo" :disabled="running">
              导入视频
            </ElDropdownItem>
            <ElDropdownItem
              v-if="storyboard.continuity?.materialUrls?.length"
              command="material"
              :disabled="running"
            >
              素材成片
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
    </div>

    <ElDialog
      v-model="zoomVisible"
      :title="`镜 ${storyboard.sceneNo} · ${storyboard.title || '未命名镜头'}`"
      width="80%"
      append-to-body
      destroy-on-close
    >
      <video
        :src="storyboard.videoUrl"
        controls
        autoplay
        class="block max-h-[75vh] w-full rounded-md bg-black"
      ></video>
    </ElDialog>
  </div>
</template>
