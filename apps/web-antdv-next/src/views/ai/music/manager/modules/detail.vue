<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { AiMusicStatusEnum } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'antdv-next';

import { getMusic } from '#/api/ai/music';
import { useDescription } from '#/components/description';
import { formatMusicDuration } from '#/views/ai/utils/format';

import { useDetailSchema } from '../data';

const formData = ref<AiMusicApi.Music>(); // 详情数据

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
});

const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  cancelText: '关 闭',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      stopPlay();
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    modalApi.lock();
    try {
      const music = await getMusic(data.id);
      // 打开期间被删除时，后端返回空
      if (!music) {
        message.warning('音乐不存在或已删除');
        await modalApi.close();
        return;
      }
      formData.value = music;
    } finally {
      modalApi.unlock();
    }
  },
});

// ========== 播放 / 暂停 ==========

const audioRef = ref<HTMLAudioElement>();
const playing = ref(false); // 是否播放中

function togglePlay() {
  const audio = audioRef.value;
  const audioUrl = formData.value?.audioUrl;
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
  audio.play().catch(() => message.error('音频加载失败'));
}

function stopPlay() {
  audioRef.value?.pause();
}
</script>

<template>
  <Modal title="音乐详情" class="w-[800px]">
    <Descriptions v-if="formData" :data="formData">
      <template #audioUrl="{ data }">
        <div
          v-if="data.audioUrl && data.status === AiMusicStatusEnum.SUCCESS"
          class="flex items-center gap-3"
        >
          <Button type="primary" size="small" @click="togglePlay">
            <template #icon>
              <IconifyIcon
                :icon="playing ? 'lucide:pause' : 'lucide:play'"
                class="mr-1 inline-block"
              />
            </template>
            {{ playing ? '暂停' : '播放' }}
          </Button>
          <a
            :href="data.audioUrl"
            download
            target="_blank"
            class="text-primary"
          >
            下载
          </a>
          <span class="text-gray-500">
            {{ formatMusicDuration(data.duration) }}
          </span>
        </div>
        <span v-else>-</span>
      </template>
      <template #videoUrl="{ data }">
        <template v-if="data.videoUrl">
          <a :href="data.videoUrl" target="_blank" class="text-primary">
            在线查看
          </a>
          <a
            :href="data.videoUrl"
            download
            target="_blank"
            class="ml-3 text-primary"
          >
            下载视频
          </a>
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
