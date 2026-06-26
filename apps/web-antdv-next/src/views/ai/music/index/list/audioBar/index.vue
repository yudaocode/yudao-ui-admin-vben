<script lang="ts" setup>
import type { MusicSong } from '../types';

import { computed, inject, nextTick, reactive, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image, Slider } from 'antdv-next';

import { currentSongKey } from '../types';

defineOptions({ name: 'AiMusicAudioBarIndex' });

const currentSong = inject(currentSongKey, ref<MusicSong>({}));
const currentAudioUrl = computed(() => currentSong.value.audioUrl || undefined);

const audioRef = ref<HTMLAudioElement | null>(null);
const audioProgress = ref(0);
const audioDuration = ref(0);
const audioProps = reactive<any>({
  autoplay: true,
  paused: false,
  currentTime: '00:00',
  duration: '00:00',
  muted: false,
  volume: 50,
}); // 音频相关属性https://www.runoob.com/tags/ref-av-dom.html

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return '00:00';
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`;
}

function toggleStatus(type: string) {
  audioProps[type] = !audioProps[type];
  if (type === 'paused' && audioRef.value) {
    if (audioProps[type]) {
      audioRef.value.pause();
    } else {
      audioRef.value.play();
    }
  }
}

/** 更新播放位置 */
function audioTimeUpdate() {
  if (!audioRef.value) {
    return;
  }
  audioProgress.value = audioRef.value.currentTime;
  audioProps.currentTime = formatAudioTime(audioRef.value.currentTime);
}

function audioLoadedMetadata() {
  if (!audioRef.value) {
    return;
  }
  audioDuration.value = audioRef.value.duration;
  audioProps.duration = formatAudioTime(audioRef.value.duration);
}

function handleProgressChange(value: number | number[]) {
  if (!audioRef.value || Array.isArray(value)) {
    return;
  }
  audioRef.value.currentTime = value;
  audioProgress.value = value;
  audioProps.currentTime = formatAudioTime(value);
}

watch(currentAudioUrl, () => {
  audioProgress.value = 0;
  audioDuration.value = 0;
  audioProps.currentTime = '00:00';
  audioProps.duration = '00:00';
  nextTick(() => {
    audioRef.value?.load();
  });
});
</script>

<template>
  <div
    class="b-1 b-l-none h-18 flex items-center justify-between border border-solid border-rose-100 bg-card px-2"
  >
    <!-- 歌曲信息 -->
    <div class="flex gap-2.5">
      <Image
        src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
        :width="45"
      />
      <div>
        <div>{{ currentSong.title || '暂无音乐' }}</div>
        <div class="text-xs text-gray-400">
          {{ currentSong.singer || currentSong.desc }}
        </div>
      </div>
    </div>
    <!-- 音频controls -->
    <div class="flex items-center gap-3">
      <IconifyIcon
        icon="majesticons:back-circle"
        class="size-5 cursor-pointer text-gray-300"
      />
      <IconifyIcon
        :icon="
          audioProps.paused
            ? 'mdi:arrow-right-drop-circle'
            : 'solar:pause-circle-bold'
        "
        class="size-7 cursor-pointer"
        @click="toggleStatus('paused')"
      />
      <IconifyIcon
        icon="majesticons:next-circle"
        class="size-5 cursor-pointer text-gray-300"
      />
      <div class="flex items-center gap-4">
        <span>{{ audioProps.currentTime }}</span>
        <Slider
          v-model:value="audioProgress"
          :max="audioDuration"
          color="#409eff"
          class="!w-40"
          @change="handleProgressChange"
        />
        <span>{{ audioProps.duration }}</span>
      </div>
      <!-- 音频 -->
      <audio
        :src="currentAudioUrl"
        :autoplay="audioProps.autoplay"
        :muted="audioProps.muted"
        ref="audioRef"
        controls
        v-show="!audioProps"
        @timeupdate="audioTimeUpdate"
        @loadedmetadata="audioLoadedMetadata"
      ></audio>
    </div>
    <div class="flex items-center gap-4">
      <IconifyIcon
        :icon="audioProps.muted ? 'tabler:volume-off' : 'tabler:volume'"
        class="size-5 cursor-pointer"
        @click="toggleStatus('muted')"
      />
      <Slider v-model:value="audioProps.volume" color="#409eff" class="!w-40" />
    </div>
  </div>
</template>
