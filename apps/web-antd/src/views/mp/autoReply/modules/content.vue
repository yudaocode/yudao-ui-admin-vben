<script lang="ts" setup>
import { Music, News, VideoPlayer, VoicePlayer } from '#/views/mp/modules';
// DONE @hw：迁移到 /apps/web-antd/src/views/mp/autoReply/modules 里；组件名可能要换一个，= = 之前写的不太好；类似 content.vue ？本质是内容~
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
      <VoicePlayer
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
      <VideoPlayer
        v-if="props.row.responseMediaUrl"
        :url="props.row.responseMediaUrl"
        style="margin-top: 10px"
      />
    </div>
    <div v-else-if="props.row.responseMessageType === 'news'">
      <News :articles="props.row.responseArticles" />
    </div>
    <div v-else-if="props.row.responseMessageType === 'music'">
      <Music
        :title="props.row.responseTitle"
        :description="props.row.responseDescription"
        :thumb-media-url="props.row.responseThumbMediaUrl"
        :music-url="props.row.responseMusicUrl"
        :hq-music-url="props.row.responseHqMusicUrl"
      />
    </div>
  </div>
</template>
