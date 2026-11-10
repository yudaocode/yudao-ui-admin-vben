<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import {
  AiMusicGenerateModeEnum,
  AiMusicStatusEnum,
  DICT_TYPE,
  isAiMusicRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import {
  ElButton,
  ElEmpty,
  ElImage,
  ElLink,
  ElProgress,
  ElSwitch,
  ElTag,
} from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import { formatMusicDuration, getMusicTitle } from '#/views/ai/utils/format';

/** AI 音乐：作品列表（我的作品、音乐广场共用） */
defineOptions({ name: 'AiMusicList' });

const props = withDefaults(
  defineProps<{
    currentId?: number; // 播放器当前的音乐编号
    list: AiMusicApi.Music[];
    loading?: boolean;
    playing?: boolean; // 播放器是否播放中
    square?: boolean; // 是否音乐广场：只读，显示作者
  }>(),
  {
    currentId: undefined,
    loading: false,
    playing: false,
    square: false,
  },
);

const emit = defineEmits<{
  concat: [item: AiMusicApi.Music];
  delete: [item: AiMusicApi.Music];
  detail: [item: AiMusicApi.Music];
  edit: [item: AiMusicApi.Music];
  extend: [item: AiMusicApi.Music];
  play: [item: AiMusicApi.Music];
  public: [item: AiMusicApi.Music, value: boolean];
}>();

/** 是否可播放：已完成且有音频 */
function canPlay(item: AiMusicApi.Music) {
  return item.status === AiMusicStatusEnum.SUCCESS && !!item.audioUrl;
}

/** 是否为当前播放中的歌曲 */
function isPlaying(item: AiMusicApi.Music) {
  return item.id === props.currentId && props.playing;
}

/** 点击封面：可播放时播放 */
function handleCoverClick(item: AiMusicApi.Music) {
  if (canPlay(item)) {
    emit('play', item);
  }
}

/** 生成模式标签：续写、完整歌曲、用户上传 */
function getModeTag(
  item: AiMusicApi.Music,
): undefined | { label: string; type: 'primary' | 'success' | 'warning' } {
  switch (item.generateMode) {
    case AiMusicGenerateModeEnum.CONCAT: {
      return { label: '完整歌曲', type: 'success' };
    }
    case AiMusicGenerateModeEnum.EXTEND: {
      return { label: '续写', type: 'primary' };
    }
    case AiMusicGenerateModeEnum.UPLOAD: {
      return { label: '用户上传', type: 'warning' };
    }
    default: {
      return undefined;
    }
  }
}

/** 描述行：续写来源 / 风格 / 描述；广场附作者 */
function getDescription(item: AiMusicApi.Music) {
  let text: string;
  if (item.generateMode === AiMusicGenerateModeEnum.EXTEND && item.refMusicId) {
    text = `续写自 #${item.refMusicId}，${formatMusicDuration(item.extendSeconds)} 起`;
  } else if (
    item.generateMode === AiMusicGenerateModeEnum.CONCAT &&
    item.refMusicId
  ) {
    text = `合并：#${item.refMusicId} 与原曲`;
  } else {
    text = item.tags || item.prompt || '-';
  }
  if (props.square && item.userNickname) {
    text += ` · by ${item.userNickname}`;
  }
  return text;
}
</script>

<template>
  <div v-loading="loading" class="min-h-[200px]">
    <ElEmpty
      v-if="!loading && list.length === 0"
      :description="
        square ? '还没有公开的作品' : '还没有作品，在左侧开始创作吧'
      "
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
      <!-- 封面：点击播放 -->
      <div
        class="relative size-[88px] flex-shrink-0 overflow-hidden rounded-md bg-[var(--el-fill-color)]"
        :class="{ 'cursor-pointer': canPlay(item) }"
        @click="handleCoverClick(item)"
      >
        <ElImage
          v-if="item.coverUrl"
          :src="item.coverUrl"
          fit="cover"
          class="size-full"
        />
        <div v-else class="flex size-full items-center justify-center">
          <IconifyIcon
            icon="ep:headset"
            class="size-7 text-[var(--el-text-color-placeholder)]"
          />
        </div>
        <div
          v-if="isAiMusicRunning(item.status)"
          class="absolute inset-0 flex items-center justify-center bg-white/70"
        >
          <IconifyIcon
            icon="ep:loading"
            class="size-[22px] animate-spin text-[var(--el-color-primary)]"
          />
        </div>
        <div
          v-else-if="canPlay(item)"
          class="absolute inset-0 flex items-center justify-center bg-black/20 text-white"
        >
          <IconifyIcon
            :icon="isPlaying(item) ? 'ep:video-pause' : 'ep:video-play'"
            class="size-7"
          />
        </div>
      </div>

      <!-- 信息与操作 -->
      <div class="flex min-w-0 flex-1 flex-col">
        <div class="flex items-center gap-1.5">
          <span
            class="cursor-pointer truncate text-[15px] font-bold hover:text-[var(--el-color-primary)]"
            :title="getMusicTitle(item.title)"
            @click="emit('detail', item)"
          >
            {{ getMusicTitle(item.title) }}
          </span>
          <ElTag size="small" type="info" class="flex-shrink-0">
            {{ item.model }}
          </ElTag>
          <ElTag
            v-if="getModeTag(item)"
            size="small"
            :type="getModeTag(item)!.type"
            class="flex-shrink-0"
          >
            {{ getModeTag(item)!.label }}
          </ElTag>
          <ElTag
            v-if="item.makeInstrumental"
            size="small"
            type="info"
            class="flex-shrink-0"
          >
            纯音乐
          </ElTag>
          <ElTag
            v-if="!square && item.publicStatus"
            size="small"
            type="success"
            class="flex-shrink-0"
          >
            已公开
          </ElTag>
        </div>
        <div
          class="mt-1 truncate text-xs text-[var(--el-text-color-secondary)]"
        >
          {{ getDescription(item) }}
        </div>

        <!-- 状态 -->
        <div class="mt-1.5 flex-1 text-xs">
          <template v-if="isAiMusicRunning(item.status)">
            <div class="flex items-center gap-2">
              <DictTag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="item.status" />
              <ElProgress
                :percentage="item.progress || 0"
                :stroke-width="6"
                class="max-w-[240px] flex-1"
              />
            </div>
            <div class="mt-1 text-[var(--el-text-color-placeholder)]">
              {{
                item.status === AiMusicStatusEnum.SAVING
                  ? '正在保存封面与音频，完成后即可播放'
                  : '通常 1~3 分钟完成'
              }}
            </div>
          </template>
          <div
            v-else-if="item.status === AiMusicStatusEnum.FAIL"
            class="line-clamp-2 text-[var(--el-color-danger)]"
            :title="item.errorMessage"
          >
            <IconifyIcon icon="ep:warning-filled" class="mr-0.5 inline" />
            {{ item.errorMessage || '生成失败' }}
          </div>
          <div v-else class="text-[var(--el-text-color-secondary)]">
            {{ formatMusicDuration(item.duration) }}
            <span class="ml-2">
              <IconifyIcon icon="ep:headset" class="mr-0.5 inline" />
              {{ item.playCount || 0 }}
            </span>
            <span class="ml-2">
              {{ formatDate(item.createTime, 'YYYY-MM-DD HH:mm') }}
            </span>
          </div>
        </div>

        <!-- 操作：右下角 -->
        <div
          class="mt-1.5 flex flex-wrap items-center justify-end gap-x-3 gap-y-1"
        >
          <template v-if="item.status === AiMusicStatusEnum.SUCCESS">
            <ElButton
              link
              type="primary"
              :disabled="!item.audioUrl"
              @click="emit('play', item)"
            >
              <IconifyIcon
                :icon="isPlaying(item) ? 'ep:video-pause' : 'ep:video-play'"
                class="mr-0.5"
              />
              {{ isPlaying(item) ? '暂停' : '播放' }}
            </ElButton>
            <ElLink
              v-if="item.audioUrl"
              type="primary"
              underline="never"
              :href="item.audioUrl"
              download
              target="_blank"
            >
              <IconifyIcon icon="ep:download" class="mr-0.5" /> 下载
            </ElLink>
            <ElLink
              v-if="item.videoUrl"
              type="primary"
              underline="never"
              :href="item.videoUrl"
              target="_blank"
            >
              <IconifyIcon icon="ep:video-camera" class="mr-0.5" /> 视频
            </ElLink>
          </template>
          <template v-if="square">
            <ElButton link type="primary" @click="emit('detail', item)">
              详情
            </ElButton>
          </template>
          <template v-else>
            <template v-if="item.status === AiMusicStatusEnum.SUCCESS">
              <ElButton
                v-if="item.generateMode === AiMusicGenerateModeEnum.EXTEND"
                link
                type="primary"
                @click="emit('concat', item)"
              >
                <IconifyIcon icon="ep:connection" class="mr-0.5" /> 合并
              </ElButton>
              <ElButton link type="primary" @click="emit('extend', item)">
                <IconifyIcon icon="ep:d-arrow-right" class="mr-0.5" /> 续写
              </ElButton>
              <ElButton link type="primary" @click="emit('edit', item)">
                <IconifyIcon icon="ep:edit" class="mr-0.5" /> 编辑
              </ElButton>
              <span
                class="inline-flex items-center text-xs text-[var(--el-text-color-regular)]"
              >
                公开
                <ElSwitch
                  :model-value="item.publicStatus"
                  size="small"
                  class="ml-1"
                  @change="(value) => emit('public', item, value as boolean)"
                />
              </span>
            </template>
            <ElButton
              link
              type="danger"
              :disabled="isAiMusicRunning(item.status)"
              @click="emit('delete', item)"
            >
              <IconifyIcon icon="ep:delete" class="mr-0.5" /> 删除
            </ElButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
