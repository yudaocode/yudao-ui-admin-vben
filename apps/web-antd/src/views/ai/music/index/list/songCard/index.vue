<script lang="ts" setup>
import { inject } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Image } from 'ant-design-vue';

defineOptions({ name: 'AiMusicSongCardIndex' });

defineProps({
  songInfo: {
    type: Object,
    default: () => ({}),
  },
});

const emits = defineEmits(['play']);

const currentSong = inject('currentSong', {});

function playSong() {
  emits('play');
}
</script>

<template>
  <div class="rounded-1 mb-[12px] flex p-[12px]">
    <div class="relative" @click="playSong">
      <Image :src="songInfo.imageUrl" class="w-80px flex-none" />
      <div
        class="bg-op-40 absolute left-0 top-0 flex h-full w-full cursor-pointer items-center justify-center bg-black"
      >
        <IconifyIcon
          :icon="
            currentSong.id === songInfo.id
              ? 'solar:pause-circle-bold'
              : 'mdi:arrow-right-drop-circle'
          "
          :size="30"
        />
      </div>
    </div>
    <div class="ml-[8px]">
      <div>{{ songInfo.title }}</div>
      <div class="mt-[8px] line-clamp-2 text-[12px]">
        {{ songInfo.desc }}
      </div>
    </div>
  </div>
</template>
