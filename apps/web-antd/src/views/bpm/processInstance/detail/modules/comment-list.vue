<script lang="ts" setup>
import type { BpmCommentApi } from '#/api/bpm/comment';

import { ref, watch } from 'vue';

import { DICT_TYPE } from '@vben/constants';
import { getDictObj } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Avatar, Empty } from 'ant-design-vue';

import { getCommentListByProcessInstanceId } from '#/api/bpm/comment';
import DictTag from '#/components/dict-tag/dict-tag.vue';

defineOptions({ name: 'BpmProcessInstanceCommentList' });

const props = withDefaults(
  defineProps<{
    id?: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const commentLoading = ref(false); // 评论列表的加载中
const comments = ref<BpmCommentApi.Comment[]>([]); // 评论列表

const commentColorMap: Record<string, string> = {
  danger: '#ff4d4f',
  default: '#909399',
  error: '#ff4d4f',
  info: '#909399',
  primary: '#1677ff',
  success: '#52c41a',
  warning: '#faad14',
}; // 评论类型颜色映射

/** 获得评论类型简称 */
function getCommentText(type: string) {
  return (getDictObj(DICT_TYPE.BPM_COMMENT_TYPE, type)?.label || '评论').slice(
    0,
    1,
  );
}

/** 获得评论类型颜色 */
function getCommentColor(type: string) {
  const dict = getDictObj(DICT_TYPE.BPM_COMMENT_TYPE, type);
  return (
    dict?.cssClass ||
    commentColorMap[dict?.colorType || 'primary'] ||
    commentColorMap.primary
  );
}

/** 查询评论列表 */
async function getList() {
  if (!props.id) {
    comments.value = [];
    return;
  }
  commentLoading.value = true;
  try {
    comments.value = await getCommentListByProcessInstanceId(props.id);
  } finally {
    commentLoading.value = false;
  }
}

watch(
  () => props.id,
  () => getList(),
  { immediate: true },
);

defineExpose({ getList });
</script>

<template>
  <div
    v-loading="props.loading || commentLoading"
    class="min-h-full px-7 py-6"
  >
    <div class="flex items-center gap-3 border-b pb-4">
      <div class="text-lg font-bold text-gray-900 dark:text-gray-100">
        流程评论
      </div>
      <div class="text-sm text-gray-500">共 {{ comments.length }} 条</div>
    </div>
    <Empty v-if="comments.length === 0" description="暂无评论" />
    <div v-else class="mt-6 pl-2">
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="group relative flex gap-4 pb-7 last:pb-0"
      >
        <div
          class="absolute bottom-0 left-4 top-8 w-px bg-gray-200 group-last:hidden"
        ></div>
        <div
          class="z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow"
          :style="{ backgroundColor: getCommentColor(comment.type) }"
        >
          {{ getCommentText(comment.type) }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex min-h-8 items-center gap-2">
            <div class="flex shrink-0 items-center gap-2 font-bold">
              <Avatar v-if="comment.user?.avatar" :size="28" :src="comment.user.avatar" />
              <Avatar v-else :size="28">
                {{ comment.user?.nickname?.slice(0, 1) || '?' }}
              </Avatar>
              <span>{{ comment.user?.nickname || '系统' }}</span>
            </div>
            <DictTag :type="DICT_TYPE.BPM_COMMENT_TYPE" :value="comment.type" />
            <div
              v-if="comment.task?.name"
              class="inline-flex h-6 min-w-0 max-w-lg items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 text-sm text-gray-700 dark:border-blue-900 dark:bg-blue-950 dark:text-gray-200"
            >
              <span class="inline-flex shrink-0 items-center gap-1 font-medium text-blue-500">
                <IconifyIcon icon="lucide:git-branch" />
                任务
              </span>
              <span class="truncate font-medium text-gray-900 dark:text-gray-100">
                {{ comment.task.name }}
              </span>
            </div>
            <span class="ml-auto shrink-0 text-sm text-gray-500">
              {{ formatDateTime(comment.createTime) }}
            </span>
          </div>
          <div
            class="mt-2 whitespace-pre-wrap break-words rounded-md bg-gray-50 px-3.5 py-3 leading-6 text-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            {{ comment.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
