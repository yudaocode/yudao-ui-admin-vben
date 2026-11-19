<script lang="ts" setup>
import type { AiVideoApi } from '#/api/ai/video';

import {
  AiVideoStatusEnum,
  DICT_TYPE,
  isAiVideoRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { ElButton, ElEmpty, ElTag } from 'element-plus';

import { DictTag } from '#/components/dict-tag';

/** AI 视频：作品列表（我的作品、公开作品共用） */
defineOptions({ name: 'AiVideoList' });

withDefaults(
  defineProps<{
    list: AiVideoApi.Video[];
    loading?: boolean;
    square?: boolean; // 是否公开作品：不展示删除、公开标记
  }>(),
  {
    loading: false,
    square: false,
  },
);

const emit = defineEmits<{
  delete: [item: AiVideoApi.Video];
  detail: [item: AiVideoApi.Video];
  same: [item: AiVideoApi.Video];
}>();
</script>

<template>
  <div v-loading="loading" class="min-h-[200px]">
    <ElEmpty
      v-if="!loading && list.length === 0"
      :description="square ? '暂无公开作品' : '暂无作品，在左侧开始创作吧'"
    />
    <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
      <div
        v-for="item in list"
        :key="item.id"
        class="overflow-hidden rounded-lg border border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)]"
      >
        <!-- 视频 / 状态 -->
        <div class="relative aspect-video bg-[var(--el-fill-color-darker)]">
          <video
            v-if="item.status === AiVideoStatusEnum.SUCCESS && item.videoUrl"
            :src="item.videoUrl"
            :poster="item.coverUrl"
            controls
            preload="metadata"
            class="size-full object-contain"
          ></video>
          <div
            v-else-if="isAiVideoRunning(item.status)"
            class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[var(--el-text-color-secondary)]"
          >
            <IconifyIcon
              icon="ep:loading"
              class="size-6 animate-spin text-[var(--el-color-primary)]"
            />
            <DictTag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="item.status" />
          </div>
          <div
            v-else
            class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center"
          >
            <IconifyIcon
              icon="ep:warning-filled"
              class="size-6 text-[var(--el-color-danger)]"
            />
            <div
              class="line-clamp-3 text-xs text-[var(--el-color-danger)]"
              :title="item.errorMessage"
            >
              {{ item.errorMessage || '生成失败' }}
            </div>
          </div>
        </div>
        <!-- 信息 -->
        <div class="p-2.5">
          <div class="mb-1.5 flex items-center gap-1.5">
            <DictTag :type="DICT_TYPE.AI_VIDEO_TYPE" :value="item.type" />
            <span
              class="truncate text-xs text-[var(--el-text-color-secondary)]"
              :title="item.model"
            >
              {{ item.model }}
            </span>
          </div>
          <div
            class="line-clamp-2 min-h-9 text-[13px] leading-[18px]"
            :title="item.prompt"
          >
            {{ item.prompt || '（无提示词）' }}
          </div>
          <div
            class="mt-1.5 flex items-center justify-between text-xs text-[var(--el-text-color-secondary)]"
          >
            <span>
              {{
                square
                  ? item.userNickname || '-'
                  : formatDate(item.createTime, 'YYYY-MM-DD HH:mm')
              }}
            </span>
            <span v-if="item.duration">{{ item.duration }} 秒</span>
          </div>
          <!-- 操作 -->
          <div class="mt-2 flex items-center justify-between">
            <div class="flex items-center gap-1">
              <ElButton link type="primary" @click="emit('detail', item)">
                详情
              </ElButton>
              <ElButton link type="primary" @click="emit('same', item)">
                做同款
              </ElButton>
              <ElButton
                v-if="!square"
                link
                type="danger"
                :disabled="isAiVideoRunning(item.status)"
                @click="emit('delete', item)"
              >
                删除
              </ElButton>
            </div>
            <ElTag
              v-if="!square && item.publicStatus"
              type="success"
              size="small"
            >
              已公开
            </ElTag>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
