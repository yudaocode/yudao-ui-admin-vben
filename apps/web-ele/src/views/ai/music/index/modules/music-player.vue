<script lang="ts" setup>
import type { AiMusicApi } from '#/api/ai/music';

import { computed, onBeforeUnmount, onDeactivated, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { ElButton, ElImage, ElMessage, ElSlider } from 'element-plus';

import { playMusic } from '#/api/ai/music';
import { formatMusicDuration, getMusicTitle } from '#/views/ai/utils/format';

/** AI 音乐：底部播放器 */
defineOptions({ name: 'AiMusicPlayer' });

const emit = defineEmits<{
  change: [state: { id?: number; playing: boolean }]; // 当前歌曲、播放状态变化
}>();

const audioRef = ref<HTMLAudioElement>();
const playlist = ref<AiMusicApi.Music[]>([]); // 播放列表：当前列表中可播放的作品
const current = ref<AiMusicApi.Music>(); // 当前歌曲
const playing = ref(false); // 是否播放中
const currentTime = ref(0); // 当前进度（秒）
const duration = ref(0); // 总时长（秒）
const sliderValue = ref(0); // 进度条的值；拖动时不跟随播放进度
let seeking = false;

const currentIndex = computed(() =>
  playlist.value.findIndex((item) => item.id === current.value?.id),
);
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(
  () =>
    currentIndex.value >= 0 && currentIndex.value < playlist.value.length - 1,
);

watch([() => current.value?.id, playing], ([id, value]) =>
  emit('change', { id, playing: value }),
);

/**
 * 播放：同一首则切换播放 / 暂停；新歌曲从头播放，并记录一次播放
 *
 * @param music 歌曲
 * @param list 播放列表，用于上一首、下一首
 */
function play(music: AiMusicApi.Music, list?: AiMusicApi.Music[]) {
  if (list) {
    playlist.value = list.filter((item) => !!item.audioUrl);
  }
  if (current.value?.id === music.id) {
    togglePlay();
    return;
  }
  start(music);
}

function start(music: AiMusicApi.Music) {
  const audio = audioRef.value;
  if (!audio || !music.audioUrl) {
    return;
  }
  current.value = music;
  currentTime.value = 0;
  sliderValue.value = 0;
  duration.value = music.duration || 0;
  audio.src = music.audioUrl;
  audio
    .play()
    .then(() => {
      // 记录播放次数，失败不影响播放
      playMusic(music.id).catch(() => {});
      music.playCount = (music.playCount || 0) + 1;
    })
    .catch(() => {});
}

function togglePlay() {
  const audio = audioRef.value;
  if (!audio || !current.value) {
    return;
  }
  if (audio.paused) {
    audio.play().catch(() => ElMessage.error('音频加载失败'));
  } else {
    audio.pause();
  }
}

function playPrev() {
  if (hasPrev.value) {
    start(playlist.value[currentIndex.value - 1]!);
  }
}

function playNext() {
  if (hasNext.value) {
    start(playlist.value[currentIndex.value + 1]!);
  }
}

function handleTimeUpdate() {
  currentTime.value = audioRef.value?.currentTime || 0;
  if (!seeking) {
    sliderValue.value = currentTime.value;
  }
}

function handleLoaded() {
  const value = audioRef.value?.duration;
  if (value && Number.isFinite(value)) {
    duration.value = value;
  }
}

function handleSeek(value: number | number[]) {
  seeking = false;
  if (audioRef.value) {
    audioRef.value.currentTime = Array.isArray(value) ? value[0]! : value;
  }
}

watch(sliderValue, () => {
  // 拖动中：进度条与播放进度不一致时，暂不跟随
  seeking = Math.abs(sliderValue.value - currentTime.value) > 1;
});

function handleEnded() {
  if (hasNext.value) {
    playNext();
  }
}

function handleError() {
  if (current.value) {
    ElMessage.error('音频加载失败');
  }
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
    <!-- 当前歌曲 -->
    <div class="flex w-60 flex-shrink-0 items-center gap-2.5 overflow-hidden">
      <ElImage
        :src="current?.coverUrl"
        fit="cover"
        class="size-11 flex-shrink-0 rounded bg-[var(--el-fill-color)]"
      >
        <template #error>
          <div class="flex size-full items-center justify-center">
            <IconifyIcon icon="ep:headset" />
          </div>
        </template>
      </ElImage>
      <div class="min-w-0">
        <div class="truncate font-bold">
          {{ getMusicTitle(current?.title) }}
        </div>
        <div class="truncate text-xs text-[var(--el-text-color-secondary)]">
          {{ current?.tags || current?.userNickname || '' }}
        </div>
      </div>
    </div>

    <!-- 控制 -->
    <div class="flex flex-shrink-0 items-center gap-1.5">
      <ElButton circle size="small" :disabled="!hasPrev" @click="playPrev">
        <IconifyIcon icon="ep:d-arrow-left" />
      </ElButton>
      <ElButton circle type="primary" @click="togglePlay">
        <IconifyIcon :icon="playing ? 'ep:video-pause' : 'ep:video-play'" />
      </ElButton>
      <ElButton circle size="small" :disabled="!hasNext" @click="playNext">
        <IconifyIcon icon="ep:d-arrow-right" />
      </ElButton>
    </div>

    <!-- 进度 -->
    <div class="flex min-w-0 flex-1 items-center gap-2.5">
      <span
        class="w-11 text-right text-xs text-[var(--el-text-color-secondary)]"
      >
        {{ formatMusicDuration(currentTime) }}
      </span>
      <ElSlider
        v-model="sliderValue"
        :max="duration || 0"
        :step="1"
        :show-tooltip="false"
        :disabled="!duration"
        class="flex-1"
        @change="handleSeek"
      />
      <span class="w-11 text-xs text-[var(--el-text-color-secondary)]">
        {{ formatMusicDuration(duration || current?.duration) }}
      </span>
    </div>

    <ElButton link @click="close">
      <IconifyIcon icon="ep:close" />
    </ElButton>

    <audio
      ref="audioRef"
      class="hidden"
      @play="playing = true"
      @pause="playing = false"
      @timeupdate="handleTimeUpdate"
      @loadedmetadata="handleLoaded"
      @ended="handleEnded"
      @error="handleError"
    ></audio>
  </div>
</template>
