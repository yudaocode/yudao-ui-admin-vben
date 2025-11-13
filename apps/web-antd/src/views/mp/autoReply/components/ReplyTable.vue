<script lang="ts" setup>
import { WxMusic } from '#/views/mp/components/wx-music';
import { WxNews } from '#/views/mp/components/wx-news';
import { WxVideoPlayer } from '#/views/mp/components/wx-video-play';
import { WxVoicePlayer } from '#/views/mp/components/wx-voice-play';
// TODO @hw：迁移到 /Users/yunai/Java/yudao-ui-admin-vben-v5/apps/web-antd/src/views/mp/autoReply/modules 里；组件名可能要换一个，= = 之前写的不太好；类似 content.vue ？本质是内容~
defineOptions({ name: 'ReplyContentCell' });

const props = defineProps<{
  row: any;
}>();
</script>

<template>
  <div>
    <div v-if="props.row.responseMessageType === 'text'">
      {{ props.row.responseContent }}
    </div>
    <div v-else-if="props.row.responseMessageType === 'voice'">
      <WxVoicePlayer
        v-if="props.row.responseMediaUrl"
        :url="props.row.responseMediaUrl"
      />
    </div>
    <div v-else-if="props.row.responseMessageType === 'image'">
      <a target="_blank" :href="props.row.responseMediaUrl">
        <img :src="props.row.responseMediaUrl" style="width: 100px" />
      </a>
    </div>
    <div
      v-else-if="
        props.row.responseMessageType === 'video' ||
        props.row.responseMessageType === 'shortvideo'
      "
    >
      <WxVideoPlayer
        v-if="props.row.responseMediaUrl"
        :url="props.row.responseMediaUrl"
        style="margin-top: 10px"
      />
    </div>
    <div v-else-if="props.row.responseMessageType === 'news'">
      <WxNews :articles="props.row.responseArticles" />
    </div>
    <div v-else-if="props.row.responseMessageType === 'music'">
      <WxMusic
        :title="props.row.responseTitle"
        :description="props.row.responseDescription"
        :thumb-media-url="props.row.responseThumbMediaUrl"
        :music-url="props.row.responseMusicUrl"
        :hq-music-url="props.row.responseHqMusicUrl"
      />
    </div>
  </div>
</template>
