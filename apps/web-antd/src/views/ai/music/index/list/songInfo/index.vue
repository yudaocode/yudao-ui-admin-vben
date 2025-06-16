<script lang="ts" setup>
import { inject } from 'vue';

import { Button, Card, Image } from 'ant-design-vue';

defineOptions({ name: 'Index' });

const currentSong = inject('currentSong', {});
</script>

<template>
  <Card class="line-height-24px mb-[0!important] w-[300px]">
    <Image :src="currentSong.imageUrl" style="width: 100%; height: 100%" />

    <div class="">{{ currentSong.title }}</div>
    <div class="line-clamp-1 text-[12px]">
      {{ currentSong.desc }}
    </div>
    <div class="text-[12px]">
      {{ currentSong.date }}
    </div>
    <Button size="small" shape="round" class="my-[6px]">信息复用</Button>
    <div class="text-[12px]" v-html="currentSong.lyric"></div>
  </Card>
</template>
