<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useVbenDrawer } from '@vben/common-ui';
import {
  AiMusicGenerateModeEnum,
  AiMusicStatusEnum,
  DICT_TYPE,
} from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatDate } from '@vben/utils';

import { useClipboard } from '@vueuse/core';
import { Button, Image, message } from 'antdv-next';

import { getMusicDetail } from '#/api/ai/music';
import { DictTag } from '#/components/dict-tag';
import { formatMusicDuration, getMusicTitle } from '#/views/ai/utils/format';

/** AI 音乐：作品详情抽屉 */
defineOptions({ name: 'AiMusicDetailDrawer' });

const emit = defineEmits<{
  play: [item: AiMusicApi.Music];
}>();

const route = useRoute();
const router = useRouter();

const detail = ref<AiMusicApi.Music>(); // 详情

const canPlay = computed(
  () =>
    detail.value?.status === AiMusicStatusEnum.SUCCESS &&
    !!detail.value?.audioUrl,
);

/** 来源：生成模式 + 续写、合并的来源作品 */
const sourceText = computed(() => {
  const item = detail.value;
  if (!item) {
    return '';
  }
  const mode =
    getDictLabel(DICT_TYPE.AI_GENERATE_MODE, item.generateMode) || '-';
  if (item.generateMode === AiMusicGenerateModeEnum.EXTEND && item.refMusicId) {
    const start = formatMusicDuration(item.extendSeconds);
    return `${mode} · 续写自 #${item.refMusicId}，从 ${start} 起`;
  }
  if (item.generateMode === AiMusicGenerateModeEnum.CONCAT && item.refMusicId) {
    return `${mode} · 由续写作品 #${item.refMusicId} 与原曲合并`;
  }
  return mode;
});

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      detail.value = undefined;
      return;
    }
    // 加载数据：本人或已公开的作品；无权查看时后端返回“音乐不存在”
    const data = drawerApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    drawerApi.lock();
    try {
      detail.value = await getMusicDetail(data.id);
    } catch {
      await drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
});

/** 复制链接：当前页面地址 + ?id= */
const { copy, isSupported } = useClipboard({ legacy: true });
async function handleCopyLink() {
  if (!detail.value) {
    return;
  }
  if (!isSupported.value) {
    message.error('复制失败');
    return;
  }
  const { href } = router.resolve({
    path: route.path,
    query: { id: detail.value.id },
  });
  try {
    await copy(new URL(href, window.location.href).toString());
    message.success('复制成功');
  } catch {
    message.error('复制失败');
  }
}
</script>

<template>
  <Drawer title="作品详情" class="w-[460px]">
    <template v-if="detail">
      <div class="flex gap-4">
        <div
          class="flex size-[120px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
        >
          <Image
            v-if="detail.coverUrl"
            :src="detail.coverUrl"
            :width="120"
            :height="120"
            class="object-cover"
          />
          <IconifyIcon v-else icon="lucide:headphones" class="size-8" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="break-all text-xl font-bold">
            {{ getMusicTitle(detail.title) }}
          </div>
          <div class="mt-1 text-xs text-gray-500">
            {{ detail.tags || detail.prompt || '' }}
          </div>
          <div class="mt-2 text-[13px]">{{ detail.userNickname || '' }}</div>
          <div class="mt-1 text-xs text-gray-500">
            {{ formatDate(detail.createTime, 'YYYY-MM-DD HH:mm') }} ·
            {{ detail.model }} · {{ formatMusicDuration(detail.duration) }}
          </div>
          <div class="mt-2.5 flex flex-wrap gap-2">
            <Button
              type="primary"
              size="small"
              :disabled="!canPlay"
              @click="emit('play', detail)"
            >
              <template #icon>
                <IconifyIcon icon="lucide:play" class="mr-1 inline-block" />
              </template>
              播放 {{ detail.playCount || 0 }}
            </Button>
            <Button size="small" @click="handleCopyLink">复制链接</Button>
            <Button
              v-if="canPlay"
              size="small"
              :href="detail.audioUrl"
              download
              target="_blank"
            >
              下载
            </Button>
          </div>
        </div>
      </div>

      <div v-if="detail.status !== AiMusicStatusEnum.SUCCESS" class="mt-4">
        <DictTag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="detail.status" />
        <span
          v-if="detail.status === AiMusicStatusEnum.FAIL"
          class="ml-2 text-xs text-red-500"
        >
          {{ detail.errorMessage }}
        </span>
      </div>

      <div class="mb-2 mt-5 font-bold">歌词</div>
      <div
        class="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-3.5 text-[13px] leading-[22px] dark:bg-gray-800"
      >
        {{
          detail.lyric ||
          (detail.makeInstrumental ? '纯音乐，无歌词' : '暂无歌词')
        }}
      </div>

      <div class="mb-1.5 mt-5 font-bold">来源</div>
      <div class="text-xs text-gray-500">{{ sourceText }}</div>

      <template v-if="detail.videoUrl">
        <div class="mb-2 mt-5 font-bold">视频</div>
        <div class="flex gap-2">
          <Button
            size="small"
            type="primary"
            ghost
            :href="detail.videoUrl"
            target="_blank"
          >
            <template #icon>
              <IconifyIcon icon="lucide:video" class="mr-1 inline-block" />
            </template>
            在线查看
          </Button>
          <Button size="small" :href="detail.videoUrl" download target="_blank">
            下载视频
          </Button>
        </div>
      </template>
    </template>
  </Drawer>
</template>
