<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiMusicStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElImage, ElLink, ElMessage } from 'element-plus';

import { getMusic } from '#/api/ai/music';
import { useDescription } from '#/components/description';
import { formatMusicDuration } from '#/views/ai/utils/format';

import { useDetailSchema } from '../data';

const detail = ref<AiMusicApi.Music>(); // 详情数据

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      stopPlay();
      detail.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      const music = await getMusic(data.id);
      // 打开期间被删除时，后端返回空
      if (!music) {
        ElMessage.warning('音乐不存在或已删除');
        await modalApi.close();
        return;
      }
      detail.value = music;
    } finally {
      modalApi.unlock();
    }
  },
});

/** 播放 / 暂停 */
const audioRef = ref<HTMLAudioElement>();
const playing = ref(false); // 是否播放中
function togglePlay() {
  const audio = audioRef.value;
  const audioUrl = detail.value?.audioUrl;
  if (!audio || !audioUrl) {
    return;
  }
  if (playing.value) {
    audio.pause();
    return;
  }
  if (audio.src !== audioUrl) {
    audio.src = audioUrl;
  }
  audio.play().catch(() => ElMessage.error('音频加载失败'));
}

function stopPlay() {
  audioRef.value?.pause();
}
</script>

<template>
  <Modal
    title="音乐详情"
    class="w-[800px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="detail">
      <template #coverUrl="{ data }">
        <ElImage
          v-if="data?.coverUrl"
          :src="data.coverUrl"
          :preview-src-list="[data.coverUrl]"
          preview-teleported
          fit="cover"
          class="size-20 rounded"
        />
        <span v-else>-</span>
      </template>
      <template #audioUrl="{ data }">
        <div
          v-if="data?.audioUrl && data.status === AiMusicStatusEnum.SUCCESS"
          class="flex items-center gap-3"
        >
          <ElButton type="primary" size="small" @click="togglePlay">
            <IconifyIcon
              :icon="playing ? 'ep:video-pause' : 'ep:video-play'"
              class="mr-1"
            />
            {{ playing ? '暂停' : '播放' }}
          </ElButton>
          <ElLink type="primary" :href="data.audioUrl" download target="_blank">
            下载
          </ElLink>
          <span class="text-[var(--el-text-color-secondary)]">
            {{ formatMusicDuration(data.duration) }}
          </span>
        </div>
        <span v-else>-</span>
      </template>
      <template #videoUrl="{ data }">
        <template v-if="data?.videoUrl">
          <ElLink type="primary" :href="data.videoUrl" target="_blank">
            在线查看
          </ElLink>
          <ElLink
            type="primary"
            :href="data.videoUrl"
            download
            target="_blank"
            class="ml-3"
          >
            下载视频
          </ElLink>
        </template>
        <span v-else>-</span>
      </template>
    </Descriptions>
    <audio
      ref="audioRef"
      class="hidden"
      @play="playing = true"
      @pause="playing = false"
    ></audio>
  </Modal>
</template>
