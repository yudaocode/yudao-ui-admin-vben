<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';

import { onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { getSpeech } from '#/api/ai/speech';
import { useDescription } from '#/components/description';
import { canPlaySpeech, downloadSpeech } from '#/views/ai/utils/speech';

import { useDetailSchema } from '../data';

/** AI 语音生成管理：详情弹窗；只查看，不提供再次生成 */
defineOptions({ name: 'AiSpeechDetail' });

const formData = ref<AiSpeechApi.Speech>(); // 详情数据

const [Descriptions] = useDescription({
  bordered: true,
  column: 2,
  schema: useDetailSchema(),
});

let loadSeq = 0; // 加载序号：关闭、重新打开时自增，丢弃过期的响应
const [Modal, modalApi] = useVbenModal({
  showConfirmButton: false,
  cancelText: '关 闭',
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      loadSeq++;
      modalApi.unlock(); // 关闭时解锁：过期的请求不再解锁，避免解掉新请求的锁
      stopPlay();
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData() as { id: number };
    if (!data?.id) {
      return;
    }
    const seq = ++loadSeq;
    modalApi.lock();
    try {
      const res = await getSpeech(data.id);
      // 已关闭或已重新打开：丢弃结果
      if (seq !== loadSeq) {
        return;
      }
      // 打开期间被删除时，后端返回空
      if (!res) {
        message.warning('语音不存在或已删除');
        await modalApi.close();
        return;
      }
      formData.value = res;
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
  audio.play().catch((error) => {
    // 暂停、关闭会中断 play()，AbortError 不提示
    if (error?.name !== 'AbortError') {
      message.error('音频加载失败');
    }
  });
}

function stopPlay() {
  audioRef.value?.pause();
}

/** 销毁：暂停并释放音频 */
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
  <Modal title="语音详情" class="w-[800px]">
    <Descriptions v-if="formData" :data="formData">
      <template #audioUrl="{ data }">
        <div v-if="canPlaySpeech(data)" class="flex items-center gap-3">
          <Button type="primary" size="small" @click="togglePlay">
            <template #icon>
              <IconifyIcon
                :icon="playing ? 'lucide:pause' : 'lucide:play'"
                class="mr-1 inline-block"
              />
            </template>
            {{ playing ? '暂停' : '播放' }}
          </Button>
          <Button type="link" size="small" @click="downloadSpeech(data)">
            下载
          </Button>
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
