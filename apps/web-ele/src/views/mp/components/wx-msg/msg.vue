<script lang="ts" setup>
import { MpMsgType } from '@vben/constants';
import { IconifyIcon } from '@vben/icons';

import { ElLink } from 'element-plus';

import {
  WxLocation,
  WxMusic,
  WxNews,
  WxVideoPlayer,
  WxVoicePlayer,
} from '#/views/mp/components';

import MsgEvent from './msg-event.vue';

defineOptions({ name: 'WxMsg' });

withDefaults(
  defineProps<{
    item?: any;
  }>(),
  {
    item: {},
  },
);
</script>

<template>
  <div>
    <MsgEvent v-if="item.type === MpMsgType.Event" :item="item" />

    <div v-else-if="item.type === MpMsgType.Text">{{ item.content }}</div>

    <div v-else-if="item.type === MpMsgType.Voice">
      <WxVoicePlayer :url="item.mediaUrl" :content="item.recognition" />
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
      <WxVideoPlayer :url="item.mediaUrl" />
    </div>

    <div v-else-if="item.type === MpMsgType.Link" class="flex-1">
      <ElLink
        type="success"
        :underline="false"
        target="_blank"
        :href="item.url"
      >
        <div
          class="mb-3 text-base text-[rgba(0,0,0,0.85)] hover:text-[#1890ff]"
        >
          <IconifyIcon icon="ep:link" class="mr-1 inline-block" />{{
            item.title
          }}
        </div>
      </ElLink>
      <div
        class="h-auto overflow-hidden text-[rgba(0,0,0,0.45)]"
        style="height: unset"
      >
        {{ item.description }}
      </div>
    </div>

    <div v-else-if="item.type === MpMsgType.Location">
      <WxLocation
        :label="item.label"
        :location-y="item.locationY"
        :location-x="item.locationX"
      />
    </div>

    <div v-else-if="item.type === MpMsgType.News" class="w-[300px]">
      <WxNews :articles="item.articles" />
    </div>

    <div v-else-if="item.type === MpMsgType.Music">
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
