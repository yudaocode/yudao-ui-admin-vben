<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';

import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { Button, Empty, Spin, Tag } from 'ant-design-vue';

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

const props = withDefaults(
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

/** 是否当前播放中 */
function isPlaying(item: AiSpeechApi.Speech) {
  return item.id === props.currentId && props.playing;
}
</script>

<template>
  <Spin :spinning="loading">
    <div class="min-h-[200px]">
      <Empty
        v-if="!loading && list.length === 0"
        description="还没有语音，在左侧开始合成吧"
        class="pt-10"
      />
      <div
        v-for="item in list"
        :key="item.id"
        class="mb-3 flex gap-3 rounded-lg border border-solid p-3"
        :class="item.id === currentId ? 'border-primary' : 'border-border'"
      >
        <!-- 播放：点击播放 / 暂停 -->
        <div
          class="flex size-14 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
          :class="{ 'cursor-pointer hover:bg-primary/10': canPlaySpeech(item) }"
          @click="canPlaySpeech(item) && emit('play', item)"
        >
          <IconifyIcon
            v-if="isSpeechRunning(item)"
            icon="lucide:loader-circle"
            class="size-[22px] animate-spin text-primary"
          />
          <IconifyIcon
            v-else-if="canPlaySpeech(item)"
            :icon="isPlaying(item) ? 'lucide:pause' : 'lucide:play'"
            class="size-[26px] text-primary"
          />
          <IconifyIcon
            v-else
            icon="lucide:volume-x"
            class="size-[22px] text-gray-400"
          />
        </div>

        <!-- 信息与操作 -->
        <div class="flex min-w-0 flex-1 flex-col">
          <div
            class="line-clamp-2 cursor-pointer break-all text-sm leading-[22px] hover:text-primary"
            :title="item.inputText"
            @click="emit('detail', item)"
          >
            {{ item.inputText }}
          </div>
          <div class="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Tag class="!mr-0">{{ item.model }}</Tag>
            <Tag class="!mr-0">{{ getSpeechVoiceLabel(item) }}</Tag>
            <Tag class="!mr-0">{{ getSpeechFormatLabel(item.format) }}</Tag>
            <Tag class="!mr-0">{{ formatSpeechSpeed(item.speed) }}</Tag>
          </div>

          <!-- 状态 -->
          <div class="mt-1.5 flex-1 text-xs">
            <div
              v-if="isSpeechRunning(item)"
              class="flex items-center gap-1.5 text-primary"
            >
              <Tag color="processing" class="!mr-0">生成中</Tag>
              <span class="text-gray-400">完成后自动刷新</span>
            </div>
            <div
              v-else-if="item.status === AiSpeechStatusEnum.FAIL"
              class="line-clamp-2 break-all text-red-500"
              :title="item.errorMessage"
            >
              <IconifyIcon
                icon="lucide:circle-alert"
                class="mr-0.5 inline-block align-[-2px]"
              />
              {{ item.errorMessage || '生成失败' }}
            </div>
            <div v-else class="text-gray-500">
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
              <Button
                type="link"
                size="small"
                class="!px-0"
                @click="emit('play', item)"
              >
                <template #icon>
                  <IconifyIcon
                    :icon="isPlaying(item) ? 'lucide:pause' : 'lucide:play'"
                    class="mr-0.5 inline-block"
                  />
                </template>
                {{ isPlaying(item) ? '暂停' : '播放' }}
              </Button>
              <Button
                type="link"
                size="small"
                class="!px-0"
                @click="downloadSpeech(item)"
              >
                <template #icon>
                  <IconifyIcon
                    icon="lucide:download"
                    class="mr-0.5 inline-block"
                  />
                </template>
                下载
              </Button>
            </template>
            <Button
              type="link"
              size="small"
              class="!px-0"
              @click="emit('detail', item)"
            >
              <template #icon>
                <IconifyIcon
                  icon="lucide:file-text"
                  class="mr-0.5 inline-block"
                />
              </template>
              详情
            </Button>
            <Button
              type="link"
              size="small"
              class="!px-0"
              @click="emit('again', item)"
            >
              <template #icon>
                <IconifyIcon
                  icon="lucide:rotate-ccw"
                  class="mr-0.5 inline-block"
                />
              </template>
              再次生成
            </Button>
            <Button
              type="link"
              size="small"
              danger
              class="!px-0"
              :disabled="isSpeechRunning(item)"
              :title="isSpeechRunning(item) ? '生成中，暂不能删除' : ''"
              @click="emit('delete', item)"
            >
              <template #icon>
                <IconifyIcon
                  icon="lucide:trash-2"
                  class="mr-0.5 inline-block"
                />
              </template>
              删除
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Spin>
</template>
