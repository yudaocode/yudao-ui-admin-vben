<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';

import { onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { ElButton, ElLink, ElMessage } from 'element-plus';

import { getSpeech } from '#/api/ai/speech';
import { useDescription } from '#/components/description';
import { canPlaySpeech, downloadSpeech } from '#/views/ai/utils/speech';

import { useDetailSchema } from '../data';

/** AI 语音生成管理：详情弹窗；只查看，不提供再次生成 */
defineOptions({ name: 'AiSpeechDetail' });

const detail = ref<AiSpeechApi.Speech>(); // 详情数据

const [Descriptions] = useDescription({
  border: true,
  column: 2,
  schema: useDetailSchema(),
});

let loadSeq = 0; // 加载序号：关闭或重新打开后，过期的响应不再回填

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadSeq++;
      modalApi.unlock(); // 关闭时解锁：过期的请求不再解锁，避免解掉新请求的锁
      stopPlay();
      detail.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data || !data.id) {
      return;
    }
    const seq = ++loadSeq;
    modalApi.lock();
    try {
      const speech = await getSpeech(data.id);
      if (seq !== loadSeq) {
        return;
      }
      // 打开期间被删除时，后端返回空
      if (!speech) {
        ElMessage.warning('语音不存在或已删除');
        await modalApi.close();
        return;
      }
      detail.value = speech;
    } catch {
      // 失败提示由请求拦截器负责，不留空弹窗
      if (seq === loadSeq) {
        await modalApi.close();
      }
    } finally {
      if (seq === loadSeq) {
        modalApi.unlock();
      }
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
  audio.play().catch((error) => {
    if (error?.name !== 'AbortError') {
      ElMessage.error('音频加载失败');
    }
  });
}

function stopPlay() {
  audioRef.value?.pause();
}

onBeforeUnmount(() => {
  const audio = audioRef.value;
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
});
</script>

<template>
  <Modal
    title="语音详情"
    class="w-[800px]"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions :data="detail">
      <template #audioUrl="{ data }">
        <div v-if="canPlaySpeech(data)" class="flex items-center gap-3">
          <ElButton type="primary" size="small" @click="togglePlay">
            <IconifyIcon
              :icon="playing ? 'ep:video-pause' : 'ep:video-play'"
              class="mr-1"
            />
            {{ playing ? '暂停' : '播放' }}
          </ElButton>
          <ElLink type="primary" @click="downloadSpeech(data)">下载</ElLink>
        </div>
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
