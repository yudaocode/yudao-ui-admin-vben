<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';

import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { ElButton, ElEmpty, ElTag } from 'element-plus';

import {
  AiSpeechStatusEnum,
  canPlaySpeech,
  downloadSpeech,
  formatSpeechSize,
  formatSpeechSpeed,
  getSpeechFormatLabel,
  getSpeechVoiceLabel,
  isSpeechRunning,
} from '#/views/ai/utils/speech';

/** AI 语音：我的语音列表 */
defineOptions({ name: 'AiSpeechList' });

withDefaults(
  defineProps<{
    currentId?: number; // 播放器当前的语音
    list: AiSpeechApi.Speech[]; // 语音列表
    loading?: boolean; // 加载中
    playing?: boolean; // 播放器是否播放中
  }>(),
  {
    currentId: undefined,
    loading: false,
    playing: false,
  },
);

const emit = defineEmits<{
  again: [item: AiSpeechApi.Speech];
  delete: [item: AiSpeechApi.Speech];
  detail: [item: AiSpeechApi.Speech];
  play: [item: AiSpeechApi.Speech];
}>();
</script>

<template>
  <div v-loading="loading" class="min-h-[200px]">
    <ElEmpty
      v-if="!loading && list.length === 0"
      description="还没有语音，在左侧开始合成吧"
    />
    <div
      v-for="item in list"
      :key="item.id"
      class="mb-3 flex gap-3 rounded-lg border border-solid p-3"
      :class="
        item.id === currentId
          ? 'border-[var(--el-color-primary)]'
          : 'border-[var(--el-border-color-lighter)]'
      "
    >
      <!-- 播放：点击播放 / 暂停 -->
      <div
        class="flex size-14 flex-shrink-0 items-center justify-center rounded-full bg-[var(--el-fill-color)]"
        :class="{
          'cursor-pointer hover:bg-[var(--el-color-primary-light-9)]':
            canPlaySpeech(item),
        }"
        @click="canPlaySpeech(item) && emit('play', item)"
      >
        <IconifyIcon
          v-if="isSpeechRunning(item)"
          icon="ep:loading"
          class="size-[22px] animate-spin text-[var(--el-color-primary)]"
        />
        <IconifyIcon
          v-else-if="canPlaySpeech(item)"
          :icon="
            item.id === currentId && playing
              ? 'ep:video-pause'
              : 'ep:video-play'
          "
          class="size-[26px] text-[var(--el-color-primary)]"
        />
        <IconifyIcon
          v-else
          icon="ep:mute"
          class="size-[22px] text-[var(--el-text-color-placeholder)]"
        />
      </div>

      <!-- 信息与操作 -->
      <div class="flex min-w-0 flex-1 flex-col">
        <div
          class="line-clamp-2 cursor-pointer break-all text-sm leading-[22px] hover:text-[var(--el-color-primary)]"
          :title="item.inputText"
          @click="emit('detail', item)"
        >
          {{ item.inputText }}
        </div>
        <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
          <ElTag size="small" type="info">{{ item.model }}</ElTag>
          <ElTag size="small" type="info">
            {{ getSpeechVoiceLabel(item) }}
          </ElTag>
          <ElTag size="small" type="info">
            {{ getSpeechFormatLabel(item.format) }}
          </ElTag>
          <ElTag size="small" type="info">
            {{ formatSpeechSpeed(item.speed) }}
          </ElTag>
        </div>

        <!-- 状态 -->
        <div class="mt-1.5 flex-1 text-xs">
          <div
            v-if="isSpeechRunning(item)"
            class="flex items-center gap-1.5 text-[var(--el-color-primary)]"
          >
            <ElTag size="small">生成中</ElTag>
            <span class="text-[var(--el-text-color-placeholder)]">
              完成后自动刷新
            </span>
          </div>
          <div
            v-else-if="item.status === AiSpeechStatusEnum.FAIL"
            class="line-clamp-2 break-all text-[var(--el-color-danger)]"
            :title="item.errorMessage"
          >
            <IconifyIcon icon="ep:warning-filled" class="mr-0.5 inline" />
            {{ item.errorMessage || '生成失败' }}
          </div>
          <div v-else class="text-[var(--el-text-color-secondary)]">
            {{ formatSpeechSize(item.audioSize) }}
            <span class="ml-2">
              {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }}
            </span>
          </div>
        </div>

        <!-- 操作：右下角 -->
        <div
          class="mt-1.5 flex flex-wrap items-center justify-end gap-x-3 gap-y-1"
        >
          <template v-if="canPlaySpeech(item)">
            <ElButton link type="primary" @click="emit('play', item)">
              <IconifyIcon
                :icon="
                  item.id === currentId && playing
                    ? 'ep:video-pause'
                    : 'ep:video-play'
                "
                class="mr-0.5"
              />
              {{ item.id === currentId && playing ? '暂停' : '播放' }}
            </ElButton>
            <ElButton link type="primary" @click="downloadSpeech(item)">
              <IconifyIcon icon="ep:download" class="mr-0.5" /> 下载
            </ElButton>
          </template>
          <ElButton link type="primary" @click="emit('detail', item)">
            <IconifyIcon icon="ep:document" class="mr-0.5" /> 详情
          </ElButton>
          <ElButton link type="primary" @click="emit('again', item)">
            <IconifyIcon icon="ep:refresh-right" class="mr-0.5" /> 再次生成
          </ElButton>
          <ElButton
            link
            type="danger"
            :disabled="isSpeechRunning(item)"
            :title="isSpeechRunning(item) ? '生成中，暂不能删除' : ''"
            @click="emit('delete', item)"
          >
            <IconifyIcon icon="ep:delete" class="mr-0.5" /> 删除
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>
