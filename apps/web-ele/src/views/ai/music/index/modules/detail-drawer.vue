<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import { computed, ref } from 'vue';

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
import { ElButton, ElImage, ElMessage } from 'element-plus';

import { getMusicDetail } from '#/api/ai/music';
import { DictTag } from '#/components/dict-tag';
import { formatMusicDuration, getMusicTitle } from '#/views/ai/utils/format';

/** AI 音乐：作品详情抽屉 */
defineOptions({ name: 'AiMusicDetailDrawer' });

const emit = defineEmits<{
  play: [item: AiMusicApi.Music];
}>();

const loading = ref(false); // 加载中
const detail = ref<AiMusicApi.Music>(); // 详情

const canPlay = computed(
  () =>
    detail.value?.status === AiMusicStatusEnum.SUCCESS &&
    !!detail.value?.audioUrl,
);
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
    // 打开：本人或已公开的作品；无权查看时后端返回“音乐不存在”
    const data = drawerApi.getData() as { id: number };
    if (!data || !data.id) {
      return;
    }
    loading.value = true;
    try {
      detail.value = await getMusicDetail(data.id);
    } catch {
      await drawerApi.close();
    } finally {
      loading.value = false;
    }
  },
});

/** 复制链接：当前页面地址 + ?id= */
const { copy, isSupported } = useClipboard({ legacy: true });
async function copyLink() {
  if (!detail.value) {
    return;
  }
  if (!isSupported.value) {
    ElMessage.error('复制失败');
    return;
  }
  const url = new URL(window.location.href);
  url.search = `?id=${detail.value.id}`;
  url.hash = '';
  try {
    await copy(url.toString());
    ElMessage.success('复制成功');
  } catch {
    ElMessage.error('复制失败');
  }
}
</script>

<template>
  <Drawer title="作品详情" class="w-[460px]">
    <div v-loading="loading" class="min-h-[200px]">
      <template v-if="detail">
        <div class="flex gap-4">
          <ElImage
            :src="detail.coverUrl"
            :preview-src-list="detail.coverUrl ? [detail.coverUrl] : []"
            preview-teleported
            fit="cover"
            class="size-[120px] flex-shrink-0 rounded-lg bg-[var(--el-fill-color)]"
          >
            <template #error>
              <div class="flex size-full items-center justify-center">
                <IconifyIcon icon="ep:headset" class="size-8" />
              </div>
            </template>
          </ElImage>
          <div class="min-w-0 flex-1">
            <div class="break-all text-xl font-bold">
              {{ getMusicTitle(detail.title) }}
            </div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
              {{ detail.tags || detail.prompt || '' }}
            </div>
            <div class="mt-2 text-[13px]">{{ detail.userNickname || '' }}</div>
            <div class="mt-1 text-xs text-[var(--el-text-color-secondary)]">
              {{ formatDate(detail.createTime, 'YYYY-MM-DD HH:mm') }} ·
              {{ detail.model }} · {{ formatMusicDuration(detail.duration) }}
            </div>
            <div class="mt-2.5 flex flex-wrap gap-2">
              <ElButton
                type="primary"
                size="small"
                :disabled="!canPlay"
                @click="emit('play', detail)"
              >
                <IconifyIcon icon="ep:video-play" class="mr-1" />
                播放 {{ detail.playCount || 0 }}
              </ElButton>
              <ElButton size="small" @click="copyLink">复制链接</ElButton>
              <ElButton
                v-if="canPlay"
                size="small"
                tag="a"
                :href="detail.audioUrl"
                download
                target="_blank"
              >
                下载
              </ElButton>
            </div>
          </div>
        </div>

        <div v-if="detail.status !== AiMusicStatusEnum.SUCCESS" class="mt-4">
          <DictTag :type="DICT_TYPE.AI_MUSIC_STATUS" :value="detail.status" />
          <span
            v-if="detail.status === AiMusicStatusEnum.FAIL"
            class="ml-2 text-xs text-[var(--el-color-danger)]"
          >
            {{ detail.errorMessage }}
          </span>
        </div>

        <div class="mb-2 mt-5 font-bold">歌词</div>
        <div
          class="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded bg-[var(--el-fill-color-light)] p-3.5 text-[13px] leading-[22px]"
        >
          {{
            detail.lyric ||
            (detail.makeInstrumental ? '纯音乐，无歌词' : '暂无歌词')
          }}
        </div>

        <div class="mb-1.5 mt-5 font-bold">来源</div>
        <div class="text-xs text-[var(--el-text-color-secondary)]">
          {{ sourceText }}
        </div>

        <template v-if="detail.videoUrl">
          <div class="mb-2 mt-5 font-bold">视频</div>
          <ElButton
            size="small"
            type="primary"
            plain
            tag="a"
            :href="detail.videoUrl"
            target="_blank"
          >
            <IconifyIcon icon="ep:video-play" class="mr-1" /> 在线查看
          </ElButton>
          <ElButton
            size="small"
            tag="a"
            :href="detail.videoUrl"
            download
            target="_blank"
          >
            下载视频
          </ElButton>
        </template>
      </template>
    </div>
  </Drawer>
</template>
