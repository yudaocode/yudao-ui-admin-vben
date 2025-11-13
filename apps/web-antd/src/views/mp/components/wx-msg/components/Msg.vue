<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import { WxLocation } from '#/views/mp/components/wx-location';
import { WxMusic } from '#/views/mp/components/wx-music';
import { WxNews } from '#/views/mp/components/wx-news';
import { WxVideoPlayer } from '#/views/mp/components/wx-video-play';
import { WxVoicePlayer } from '#/views/mp/components/wx-voice-play';

import { MsgType } from '../types';
import MsgEvent from './MsgEvent.vue';

defineOptions({ name: 'Msg' });

defineProps<{
  item: any;
}>();
</script>

<template>
  <div>
    <MsgEvent v-if="item.type === MsgType.Event" :item="item" />

    <div v-else-if="item.type === MsgType.Text">{{ item.content }}</div>

    <div v-else-if="item.type === MsgType.Voice">
      <WxVoicePlayer :url="item.mediaUrl" :content="item.recognition" />
    </div>

    <div v-else-if="item.type === MsgType.Image">
      <a :href="item.mediaUrl" target="_blank">
        <img :src="item.mediaUrl" class="w-[100px]" alt="图片消息" />
      </a>
    </div>

    <div
      v-else-if="item.type === MsgType.Video || item.type === 'shortvideo'"
      class="text-center"
    >
      <WxVideoPlayer :url="item.mediaUrl" />
    </div>

    <div v-else-if="item.type === MsgType.Link" class="flex flex-col gap-2">
      <a :href="item.url" target="_blank" class="text-success no-underline">
        <div class="flex items-center text-sm font-medium text-[#52c41a]">
          <IconifyIcon icon="mdi:link" class="mr-1" />
          {{ item.title }}
        </div>
      </a>
      <div class="text-xs text-[#666]">{{ item.description }}</div>
    </div>

    <div v-else-if="item.type === MsgType.Location">
      <WxLocation
        :label="item.label"
        :location-y="item.locationY"
        :location-x="item.locationX"
      />
    </div>

    <div v-else-if="item.type === MsgType.News" class="w-[300px]">
      <WxNews :articles="item.articles" />
    </div>

    <div v-else-if="item.type === MsgType.Music">
      <WxMusic
        :title="item.title"
        :description="item.description"
        :thumb-media-url="item.thumbMediaUrl"
        :music-url="item.musicUrl"
        :hq-music-url="item.hqMusicUrl"
      />
    </div>
  </div>
</template>
