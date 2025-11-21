<script lang="ts" setup>
import { ref } from 'vue';

import { MpMsgType } from '@vben/constants';

import Location from '#/views/mp/components/wx-location/wx-location.vue';
import Music from '#/views/mp/components/wx-music/wx-music.vue';
import News from '#/views/mp/components/wx-news/wx-news.vue';
import VideoPlayer from '#/views/mp/components/wx-video-play/wx-video-play.vue';
import VoicePlayer from '#/views/mp/components/wx-voice-play/wx-voice-play.vue';

import MsgEvent from './msg-event.vue';

defineOptions({ name: 'Msg' });

const props = defineProps<{
  item: any;
}>();

const item = ref<any>(props.item);
</script>

<template>
  <div>
    <MsgEvent v-if="item.type === MpMsgType.Event" :item="item" />

    <div v-else-if="item.type === MpMsgType.Text">{{ item.content }}</div>

    <div v-else-if="item.type === MpMsgType.Voice">
      <VoicePlayer :url="item.mediaUrl" :content="item.recognition" />
    </div>

    <div v-else-if="item.type === MpMsgType.Image">
      <a target="_blank" :href="item.mediaUrl">
        <img :src="item.mediaUrl" class="w-[100px]" />
      </a>
    </div>

    <div
      v-else-if="item.type === MpMsgType.Video || item.type === 'shortvideo'"
      class="text-center"
    >
      <VideoPlayer :url="item.mediaUrl" />
    </div>

    <div v-else-if="item.type === MpMsgType.Link" class="flex-1">
      <el-link
        type="success"
        :underline="false"
        target="_blank"
        :href="item.url"
      >
        <div
          class="mb-3 text-base text-[rgba(0,0,0,0.85)] hover:text-[#1890ff]"
        >
          <i class="el-icon-link"></i>{{ item.title }}
        </div>
      </el-link>
      <div
        class="h-auto overflow-hidden text-[rgba(0,0,0,0.45)]"
        style="height: unset"
      >
        {{ item.description }}
      </div>
    </div>

    <div v-else-if="item.type === MpMsgType.Location">
      <Location
        :label="item.label"
        :location-y="item.locationY"
        :location-x="item.locationX"
      />
    </div>

    <div v-else-if="item.type === MpMsgType.News" class="w-[300px]">
      <News :articles="item.articles" />
    </div>

    <div v-else-if="item.type === MpMsgType.Music">
      <Music
        :title="item.title"
        :description="item.description"
        :thumb-media-url="item.thumbMediaUrl"
        :music-url="item.musicUrl"
        :hq-music-url="item.hqMusicUrl"
      />
    </div>
  </div>
</template>
