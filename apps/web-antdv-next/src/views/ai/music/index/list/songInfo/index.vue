<script lang="ts" setup>
import type { MusicSong } from '../types';

import { inject, ref } from 'vue';

import { Button, Card, Image } from 'antdv-next';

import { currentSongKey } from '../types';

defineOptions({ name: 'AiMusicSongInfoIndex' });

const currentSong = inject(currentSongKey, ref<MusicSong>({}));
</script>

<template>
  <Card class="!mb-0 w-40 leading-6">
    <Image :src="currentSong.imageUrl" class="h-full w-full" />

    <div class="">{{ currentSong.title }}</div>
    <div class="line-clamp-1 text-xs">
      {{ currentSong.desc }}
    </div>
    <div class="text-xs">
      {{ currentSong.date }}
    </div>
    <Button size="small" shape="round" class="my-2">信息复用</Button>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div class="text-xs" v-html="currentSong.lyric"></div>
  </Card>
</template>
