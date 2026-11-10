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

import { Button, Empty, Progress, Spin, Switch, Tag } from 'ant-design-vue';

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

/** 是否当前播放中 */
function isPlaying(item: AiMusicApi.Music) {
  return item.id === props.currentId && props.playing;
}

/** 生成模式标签：续写、完整歌曲、用户上传 */
function getModeTag(
  item: AiMusicApi.Music,
): undefined | { color: string; label: string } {
  switch (item.generateMode) {
    case AiMusicGenerateModeEnum.CONCAT: {
      return { label: '完整歌曲', color: 'success' };
    }
    case AiMusicGenerateModeEnum.EXTEND: {
      return { label: '续写', color: 'processing' };
    }
    case AiMusicGenerateModeEnum.UPLOAD: {
      return { label: '用户上传', color: 'warning' };
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

/** 点击封面：可播放时播放 */
function handleCoverClick(item: AiMusicApi.Music) {
  if (canPlay(item)) {
    emit('play', item);
  }
}
</script>

<template>
  <Spin :spinning="loading">
    <div class="min-h-[200px]">
      <Empty
        v-if="!loading && list.length === 0"
        :description="
          square ? '还没有公开的作品' : '还没有作品，在左侧开始创作吧'
        "
        class="pt-10"
      />
      <div
        v-for="item in list"
        :key="item.id"
        class="mb-3 flex gap-3 rounded-lg border border-solid p-3"
        :class="item.id === currentId ? 'border-primary' : 'border-border'"
      >
        <!-- 封面：点击播放 -->
        <div
          class="relative size-[88px] flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800"
          :class="{ 'cursor-pointer': canPlay(item) }"
          @click="handleCoverClick(item)"
        >
          <img
            v-if="item.coverUrl"
            :src="item.coverUrl"
            class="size-full object-cover"
          />
          <div v-else class="flex size-full items-center justify-center">
            <IconifyIcon
              icon="lucide:headphones"
              class="size-7 text-gray-400"
            />
          </div>
          <div
            v-if="isAiMusicRunning(item.status)"
            class="absolute inset-0 flex items-center justify-center bg-white/70"
          >
            <IconifyIcon
              icon="lucide:loader-circle"
              class="size-6 animate-spin text-primary"
            />
          </div>
          <div
            v-else-if="canPlay(item)"
            class="absolute inset-0 flex items-center justify-center bg-black/20 text-white"
          >
            <IconifyIcon
              :icon="isPlaying(item) ? 'lucide:pause' : 'lucide:play'"
              class="size-7"
            />
          </div>
        </div>

        <!-- 信息与操作 -->
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="flex items-center gap-1.5">
            <span
              class="cursor-pointer truncate text-[15px] font-bold hover:text-primary"
              :title="getMusicTitle(item.title)"
              @click="emit('detail', item)"
            >
              {{ getMusicTitle(item.title) }}
            </span>
            <Tag class="!mr-0 flex-shrink-0">{{ item.model }}</Tag>
            <Tag
              v-if="getModeTag(item)"
              :color="getModeTag(item)!.color"
              class="!mr-0 flex-shrink-0"
            >
              {{ getModeTag(item)!.label }}
            </Tag>
            <Tag v-if="item.makeInstrumental" class="!mr-0 flex-shrink-0">
              纯音乐
            </Tag>
            <Tag
              v-if="!square && item.publicStatus"
              color="success"
              class="!mr-0 flex-shrink-0"
            >
              已公开
            </Tag>
          </div>
          <div class="mt-1 truncate text-xs text-gray-500">
            {{ getDescription(item) }}
          </div>

          <!-- 状态 -->
          <div class="mt-1.5 flex-1 text-xs">
            <template v-if="isAiMusicRunning(item.status)">
              <div class="flex items-center gap-2">
                <DictTag
                  :type="DICT_TYPE.AI_MUSIC_STATUS"
                  :value="item.status"
                />
                <Progress
                  :percent="item.progress || 0"
                  size="small"
                  class="!mb-0 max-w-[240px] flex-1"
                />
              </div>
              <div class="mt-1 text-gray-400">
                {{
                  item.status === AiMusicStatusEnum.SAVING
                    ? '正在保存封面与音频，完成后即可播放'
                    : '通常 1~3 分钟完成'
                }}
              </div>
            </template>
            <div
              v-else-if="item.status === AiMusicStatusEnum.FAIL"
              class="line-clamp-2 text-red-500"
              :title="item.errorMessage"
            >
              <IconifyIcon
                icon="lucide:circle-alert"
                class="mr-0.5 inline-block align-[-2px]"
              />
              {{ item.errorMessage || '生成失败' }}
            </div>
            <div v-else class="flex items-center text-gray-500">
              {{ formatMusicDuration(item.duration) }}
              <span class="ml-2 inline-flex items-center">
                <IconifyIcon icon="lucide:headphones" class="mr-0.5" />
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
              <Button
                type="link"
                size="small"
                class="!px-0"
                :disabled="!item.audioUrl"
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
                v-if="item.audioUrl"
                type="link"
                size="small"
                class="!px-0"
                :href="item.audioUrl"
                download
                target="_blank"
              >
                <template #icon>
                  <IconifyIcon
                    icon="lucide:download"
                    class="mr-0.5 inline-block"
                  />
                </template>
                下载
              </Button>
              <Button
                v-if="item.videoUrl"
                type="link"
                size="small"
                class="!px-0"
                :href="item.videoUrl"
                target="_blank"
              >
                <template #icon>
                  <IconifyIcon
                    icon="lucide:video"
                    class="mr-0.5 inline-block"
                  />
                </template>
                视频
              </Button>
            </template>
            <template v-if="square">
              <Button
                type="link"
                size="small"
                class="!px-0"
                @click="emit('detail', item)"
              >
                详情
              </Button>
            </template>
            <template v-else>
              <template v-if="item.status === AiMusicStatusEnum.SUCCESS">
                <Button
                  v-if="item.generateMode === AiMusicGenerateModeEnum.EXTEND"
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="emit('concat', item)"
                >
                  <template #icon>
                    <IconifyIcon
                      icon="lucide:combine"
                      class="mr-0.5 inline-block"
                    />
                  </template>
                  合并
                </Button>
                <Button
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="emit('extend', item)"
                >
                  <template #icon>
                    <IconifyIcon
                      icon="lucide:chevrons-right"
                      class="mr-0.5 inline-block"
                    />
                  </template>
                  续写
                </Button>
                <Button
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="emit('edit', item)"
                >
                  <template #icon>
                    <IconifyIcon
                      icon="lucide:square-pen"
                      class="mr-0.5 inline-block"
                    />
                  </template>
                  编辑
                </Button>
                <span class="inline-flex items-center text-xs">
                  公开
                  <Switch
                    :checked="item.publicStatus"
                    size="small"
                    class="ml-1"
                    @change="(value) => emit('public', item, value as boolean)"
                  />
                </span>
              </template>
              <Button
                type="link"
                size="small"
                danger
                class="!px-0"
                :disabled="isAiMusicRunning(item.status)"
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
            </template>
          </div>
        </div>
      </div>
    </div>
  </Spin>
</template>
