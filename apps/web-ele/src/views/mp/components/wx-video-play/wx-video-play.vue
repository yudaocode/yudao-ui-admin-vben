<script lang="ts" setup>
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { VideoPlayer } from '@videojs-player/vue';
import { ElDialog } from 'element-plus';

import 'video.js/dist/video-js.css';

/** 微信消息 - 视频 */
defineOptions({ name: 'WxVideoPlayer' });

// TODO @hw：antd 或者 ele，props 保持一致；
const props = defineProps({
  url: {
    type: String,
    required: true,
  },
});

const dialogVideo = ref(false);

const playVideo = () => {
  dialogVideo.value = true;
};
</script>

<template>
  <div @click="playVideo()">
    <!-- 提示 -->
    <div class="flex cursor-pointer flex-col items-center">
      <IconifyIcon icon="ep:video-play" :size="32" class="mr-5px" />
      <p class="text-sm">点击播放视频</p>
    </div>

    <!-- 弹窗播放 -->
    <ElDialog v-model="dialogVideo" title="视频播放" append-to-body>
      <VideoPlayer
        v-if="dialogVideo"
        class="video-player vjs-big-play-centered"
        :src="props.url"
        poster=""
        controls
        playsinline
        :volume="0.6"
        :width="800"
        :playback-rates="[0.7, 1.0, 1.5, 2.0]"
      />
      <!-- TODO @hw：删除掉？ -->
      <!--     事件，暫時沒用
      @mounted="handleMounted"-->
      <!--        @ready="handleEvent($event)"-->
      <!--        @play="handleEvent($event)"-->
      <!--        @pause="handleEvent($event)"-->
      <!--        @ended="handleEvent($event)"-->
      <!--        @loadeddata="handleEvent($event)"-->
      <!--        @waiting="handleEvent($event)"-->
      <!--        @playing="handleEvent($event)"-->
      <!--        @canplay="handleEvent($event)"-->
      <!--        @canplaythrough="handleEvent($event)"-->
      <!--        @timeupdate="handleEvent(player?.currentTime())"-->
    </ElDialog>
  </div>
</template>
