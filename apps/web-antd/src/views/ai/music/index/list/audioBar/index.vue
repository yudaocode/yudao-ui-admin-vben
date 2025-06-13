<script lang="ts" setup>
import type { Nullable } from '@vben/types';

import { inject, reactive, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image, Slider } from 'ant-design-vue';

import { formatPast } from '#/utils/formatTime';

defineOptions({ name: 'Index' });

const currentSong = inject('currentSong', {});

const audioRef = ref<Nullable<HTMLElement>>(null);
// 音频相关属性https://www.runoob.com/tags/ref-av-dom.html
const audioProps = reactive<any>({
  autoplay: true,
  paused: false,
  currentTime: '00:00',
  duration: '00:00',
  muted: false,
  volume: 50,
});

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

// 更新播放位置
function audioTimeUpdate(args: any) {
  audioProps.currentTime = formatPast(new Date(args.timeStamp), 'mm:ss');
}
</script>

<template>
  <div
    class="b-solid b-1 b-l-none flex h-[72px] items-center justify-between px-2"
    style="background-color: #fffffd; border-color: #dcdfe6"
  >
    <!-- 歌曲信息 -->
    <div class="flex gap-[10px]">
      <Image
        src="https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"
        :width="45"
      />
      <div>
        <div>{{ currentSong.name }}</div>
        <div class="text-[12px] text-gray-400">{{ currentSong.singer }}</div>
      </div>
    </div>
    <!-- 音频controls -->
    <div class="flex items-center gap-[12px]">
      <IconifyIcon
        icon="majesticons:back-circle"
        :size="20"
        class="cursor-pointer text-gray-300"
      />
      <IconifyIcon
        :icon="
          audioProps.paused
            ? 'mdi:arrow-right-drop-circle'
            : 'solar:pause-circle-bold'
        "
        :size="30"
        class="cursor-pointer"
        @click="toggleStatus('paused')"
      />
      <IconifyIcon
        icon="majesticons:next-circle"
        :size="20"
        class="cursor-pointer text-gray-300"
      />
      <div class="flex items-center gap-[16px]">
        <span>{{ audioProps.currentTime }}</span>
        <Slider
          v-model:value="audioProps.duration"
          color="#409eff"
          class="w-[160px!important]"
        />
        <span>{{ audioProps.duration }}</span>
      </div>
      <!-- 音频 -->
      <audio
        v-bind="audioProps"
        ref="audioRef"
        controls
        v-show="!audioProps"
        @timeupdate="audioTimeUpdate"
      >
        <!-- <source :src="audioUrl" /> -->
      </audio>
    </div>
    <div class="flex items-center gap-[16px]">
      <IconifyIcon
        :icon="audioProps.muted ? 'tabler:volume-off' : 'tabler:volume'"
        :size="20"
        class="cursor-pointer"
        @click="toggleStatus('muted')"
      />
      <Slider
        v-model:value="audioProps.volume"
        color="#409eff"
        class="w-[160px!important]"
      />
    </div>
  </div>
</template>
