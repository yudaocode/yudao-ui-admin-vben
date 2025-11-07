<script lang="ts" setup>
import { ref } from 'vue';

import WxLocation from '#/views/mp/modules/wx-location';
import WxMusic from '#/views/mp/modules/wx-music';
import WxNews from '#/views/mp/modules/wx-news';
import WxVideoPlayer from '#/views/mp/modules/wx-video-play';
import WxVoicePlayer from '#/views/mp/modules/wx-voice-play';

import { MsgType } from '../types';
import MsgEvent from './msg-event.vue';

defineOptions({ name: 'Msg' });

const props = defineProps<{
  item: any;
}>();

const item = ref<any>(props.item);
</script>

<template>
  <div>
    <MsgEvent v-if="item.type === MsgType.Event" :item="item" />

    <div v-else-if="item.type === MsgType.Text">{{ item.content }}</div>

    <div v-else-if="item.type === MsgType.Voice">
      <WxVoicePlayer :url="item.mediaUrl" :content="item.recognition" />
    </div>

    <div v-else-if="item.type === MsgType.Image">
      <a target="_blank" :href="item.mediaUrl">
        <img :src="item.mediaUrl" class="w-[100px]" />
      </a>
    </div>

    <div
      v-else-if="item.type === MsgType.Video || item.type === 'shortvideo'"
      class="text-center"
    >
      <WxVideoPlayer :url="item.mediaUrl" />
    </div>

    <div v-else-if="item.type === MsgType.Link" class="flex-1">
      <a target="_blank" :href="item.url">
        <div
          class="mb-3 text-base text-[rgba(0,0,0,0.85)] hover:text-[#1890ff]"
        >
          <Icon icon="ep:link" />{{ item.title }}
        </div>
      </a>
      <div
        class="h-auto overflow-hidden text-[rgba(0,0,0,0.45)]"
        style="height: unset"
      >
        {{ item.description }}
      </div>
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

<style scoped></style>
