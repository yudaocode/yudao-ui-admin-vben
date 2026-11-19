<script lang="ts" setup>
import type { AiSpeechApi } from '#/api/ai/speech';

import { computed, onBeforeUnmount, onDeactivated, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElButton, ElMessage, ElSlider } from 'element-plus';

import { formatMusicDuration } from '#/views/ai/utils/format';
import { downloadSpeech } from '#/views/ai/utils/speech';

/** AI 语音：底部播放器；只在用户点击时播放，不自动播放、不自动连播 */
defineOptions({ name: 'AiSpeechPlayer' });

const emit = defineEmits<{
  change: [state: { id?: number; playing: boolean }]; // 当前语音、播放状态变化
}>();

const audioRef = ref<HTMLAudioElement>();
const current = ref<AiSpeechApi.Speech>(); // 当前语音
const playing = ref(false); // 是否播放中
const currentTime = ref(0); // 当前进度（秒）
const duration = ref(0); // 总时长（秒）

watch([() => current.value?.id, playing], ([id, value]) =>
  emit('change', { id, playing: value }),
);

/**
 * 播放：同一条则切换播放 / 暂停；其它语音从头播放
 *
 * @param speech 语音
 */
function play(speech: AiSpeechApi.Speech) {
  if (
    current.value?.id === speech.id &&
    current.value.audioUrl === speech.audioUrl
  ) {
    togglePlay();
    return;
  }
  const audio = audioRef.value;
  if (!audio || !speech.audioUrl) {
    return;
  }
  current.value = speech;
  currentTime.value = 0;
  duration.value = 0;
  audio.src = speech.audioUrl;
  playAudio(audio);
}

/** 播放：切换音频、暂停时 play() 会以 AbortError 中断，不算加载失败 */
function playAudio(audio: HTMLAudioElement) {
  audio.play().catch((error) => {
    if (error?.name !== 'AbortError') {
      ElMessage.error('音频加载失败，请稍后重试或下载后播放');
    }
  });
}

function togglePlay() {
  const audio = audioRef.value;
  if (!audio || !current.value) {
    return;
  }
  if (audio.paused) {
    playAudio(audio);
  } else {
    audio.pause();
  }
}

/** 进度条的值：时长未知（0、Infinity 等）时保持 0 */
const sliderValue = computed(() =>
  duration.value > 0 ? Math.min(currentTime.value, duration.value) : 0,
);

/** 读取总时长：metadata 可能晚到，timeupdate 时也会再读一次；有效时长更新后，进度限制到新范围 */
function readDuration() {
  const value = audioRef.value?.duration ?? 0;
  duration.value = Number.isFinite(value) && value > 0 ? value : 0;
  if (duration.value > 0) {
    currentTime.value = Math.min(currentTime.value, duration.value);
  }
}

function handleTimeUpdate() {
  const audio = audioRef.value;
  if (!audio) {
    return;
  }
  if (!duration.value) {
    readDuration();
  }
  currentTime.value =
    duration.value > 0
      ? Math.min(audio.currentTime, duration.value)
      : audio.currentTime;
}

/** 跳转进度：拖动、点击、键盘调整都会触发；时长未知、与当前进度相同（组件自行修正边界值）时不跳转 */
function handleSeek(value: number | number[]) {
  const audio = audioRef.value;
  const raw = Number(Array.isArray(value) ? value[0] : value);
  if (!audio || !(duration.value > 0) || !Number.isFinite(raw)) {
    return;
  }
  const time = Math.min(Math.max(raw, 0), duration.value);
  if (Math.abs(time - sliderValue.value) < 0.001) {
    return;
  }
  audio.currentTime = time;
  currentTime.value = time;
}

/** 播放结束：回到开头，不自动播放下一条 */
function handleEnded() {
  currentTime.value = 0;
  if (audioRef.value) {
    audioRef.value.currentTime = 0;
  }
}

function handleError() {
  const audio = audioRef.value;
  // 切换音频、关闭播放器时中断加载，不算失败
  if (
    !current.value ||
    !audio?.getAttribute('src') ||
    audio.error?.code === MediaError.MEDIA_ERR_ABORTED
  ) {
    return;
  }
  ElMessage.error('音频加载失败，请稍后重试或下载后播放');
}

/** 关闭播放器 */
function close() {
  const audio = audioRef.value;
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
  current.value = undefined;
  playing.value = false;
  currentTime.value = 0;
  duration.value = 0;
}

defineExpose({ play, close });

onBeforeUnmount(() => audioRef.value?.pause());
onDeactivated(() => audioRef.value?.pause());
</script>

<template>
  <div
    v-show="current"
    class="flex items-center gap-4 border-t border-solid border-[var(--el-border-color-lighter)] bg-[var(--el-bg-color)] px-4 py-2.5"
  >
    <!-- 当前语音 -->
    <div
      class="flex w-[260px] flex-shrink-0 items-center gap-2.5 overflow-hidden"
    >
      <div
        class="flex size-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--el-fill-color)]"
      >
        <IconifyIcon icon="ep:microphone" />
      </div>
      <div class="min-w-0">
        <div class="truncate font-bold" :title="current?.inputText">
          {{ current?.inputText }}
        </div>
        <div class="truncate text-xs text-[var(--el-text-color-secondary)]">
          {{ current?.model }} · {{ current?.voice }}
        </div>
      </div>
    </div>

    <!-- 控制 -->
    <ElButton circle type="primary" @click="togglePlay">
      <IconifyIcon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" />
    </ElButton>

    <!-- 进度 -->
    <div class="flex min-w-0 flex-1 items-center gap-2.5">
      <span
        class="w-11 text-right text-xs text-[var(--el-text-color-secondary)]"
      >
        {{ formatMusicDuration(currentTime) }}
      </span>
      <ElSlider
        :model-value="sliderValue"
        :max="duration || 0"
        :step="0.01"
        :show-tooltip="false"
        :disabled="!duration"
        class="flex-1"
        @update:model-value="handleSeek"
      />
      <span class="w-11 text-xs text-[var(--el-text-color-secondary)]">
        {{ duration ? formatMusicDuration(duration) : '-' }}
      </span>
    </div>

    <ElButton
      link
      :disabled="!current"
      @click="current && downloadSpeech(current)"
    >
      <IconifyIcon icon="ep:download" />
    </ElButton>
    <ElButton link @click="close">
      <IconifyIcon icon="ep:close" />
    </ElButton>

    <audio
      ref="audioRef"
      class="hidden"
      preload="metadata"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="readDuration"
      @durationchange="readDuration"
      @ended="handleEnded"
      @error="handleError"
    ></audio>
  </div>
</template>
