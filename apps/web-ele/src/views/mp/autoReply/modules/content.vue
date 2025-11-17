<script lang="ts" setup>
import { Music, News, VideoPlayer, VoicePlayer } from '#/views/mp/components';

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
        <img :src="props.row.responseMediaUrl" class="w-[100px]" />
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
        class="mt-[10px]"
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
