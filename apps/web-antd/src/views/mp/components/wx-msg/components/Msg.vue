<script lang="ts" setup>
import { IconifyIcon } from '@vben/icons';

import WxLocation from '#/views/mp/components/wx-location';
import WxMusic from '#/views/mp/components/wx-music';
import WxNews from '#/views/mp/components/wx-news';
import WxVideoPlayer from '#/views/mp/components/wx-video-play';
import WxVoicePlayer from '#/views/mp/components/wx-voice-play';

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
        <img :src="item.mediaUrl" style="width: 100px" alt="图片消息" />
      </a>
    </div>

    <div
      v-else-if="item.type === MsgType.Video || item.type === 'shortvideo'"
      class="text-center"
    >
      <WxVideoPlayer :url="item.mediaUrl" />
    </div>

    <div v-else-if="item.type === MsgType.Link" class="link-card">
      <a :href="item.url" target="_blank" class="text-success no-underline">
        <div class="link-title">
          <IconifyIcon icon="mdi:link" class="mr-1" />
          {{ item.title }}
        </div>
      </a>
      <div class="link-description">{{ item.description }}</div>
    </div>

    <div v-else-if="item.type === MsgType.Location">
      <WxLocation
        :label="item.label"
        :location-y="item.locationY"
        :location-x="item.locationX"
      />
    </div>

    <div v-else-if="item.type === MsgType.News" class="news-wrapper">
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

<style scoped lang="scss">
.link-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: #52c41a;
}

.link-description {
  font-size: 12px;
  color: #666;
}

.news-wrapper {
  width: 300px;
}
</style>
