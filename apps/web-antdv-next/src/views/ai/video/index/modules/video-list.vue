<script lang="ts" setup>
import type { AiVideoApi } from '#/api/ai/video';

import {
  AiVideoStatusEnum,
  DICT_TYPE,
  isAiVideoRunning,
} from '@vben/constants';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { Button, Empty, Spin, Tag } from 'antdv-next';

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
  <Spin :spinning="loading">
    <div class="min-h-[200px]">
      <Empty
        v-if="!loading && list.length === 0"
        :description="square ? '暂无公开作品' : '暂无作品，在左侧开始创作吧'"
        class="pt-10"
      />
      <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3">
        <div
          v-for="item in list"
          :key="item.id"
          class="overflow-hidden rounded-lg border border-solid border-border"
        >
          <!-- 视频 / 状态 -->
          <div class="relative aspect-video bg-gray-100 dark:bg-gray-800">
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
              class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-500"
            >
              <IconifyIcon
                icon="lucide:loader-circle"
                class="size-6 animate-spin text-primary"
              />
              <DictTag :type="DICT_TYPE.AI_VIDEO_STATUS" :value="item.status" />
            </div>
            <div
              v-else
              class="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-3 text-center"
            >
              <IconifyIcon
                icon="lucide:circle-alert"
                class="size-6 text-red-500"
              />
              <div
                class="line-clamp-3 text-xs text-red-500"
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
              <span class="truncate text-xs text-gray-500" :title="item.model">
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
              class="mt-1.5 flex items-center justify-between text-xs text-gray-500"
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
              <div class="flex items-center gap-3">
                <Button
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="emit('detail', item)"
                >
                  详情
                </Button>
                <Button
                  type="link"
                  size="small"
                  class="!px-0"
                  @click="emit('same', item)"
                >
                  做同款
                </Button>
                <Button
                  v-if="!square"
                  type="link"
                  size="small"
                  danger
                  class="!px-0"
                  :disabled="isAiVideoRunning(item.status)"
                  @click="emit('delete', item)"
                >
                  删除
                </Button>
              </div>
              <Tag
                v-if="!square && item.publicStatus"
                color="success"
                class="!mr-0"
              >
                已公开
              </Tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Spin>
</template>
