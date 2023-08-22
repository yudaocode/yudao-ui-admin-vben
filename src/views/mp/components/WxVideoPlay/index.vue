<script lang="ts" setup>
import 'video.js/dist/video-js.css'
import { VideoPlayer } from '@videojs-player/vue'
import { ref } from 'vue'
import { Modal } from 'ant-design-vue'

defineOptions({ name: 'WxVideoPlayer' })

const props = defineProps({
  url: {
    type: String,
    required: true,
  },
})

const openVideo = ref(false)

// const handleEvent = (log) => {
//   console.log('Basic player event', log)
// }

function playVideo() {
  openVideo.value = true
}
</script>

<template>
  <div @click="playVideo()">
    <!-- 提示 -->
    <div>
      <Icon icon="ep:video-play" :size="32" class="mr-5px" />
      <p class="text-sm">
        点击播放视频
      </p>
    </div>

    <!-- 弹窗播放 -->
    <Modal v-model:open="openVideo" title="视频播放" append-to-body>
      <VideoPlayer
        v-if="openVideo"
        class="video-player vjs-big-play-centered"
        :src="props.url"
        poster=""
        crossorigin="anonymous"
        playsinline
        controls
        :volume="0.6"
        :width="800"
        :playback-rates="[0.7, 1.0, 1.5, 2.0]"
      />
      <!--     事件，暫時沒用
      @mounted="handleMounted" -->
      <!--        @ready="handleEvent($event)" -->
      <!--        @play="handleEvent($event)" -->
      <!--        @pause="handleEvent($event)" -->
      <!--        @ended="handleEvent($event)" -->
      <!--        @loadeddata="handleEvent($event)" -->
      <!--        @waiting="handleEvent($event)" -->
      <!--        @playing="handleEvent($event)" -->
      <!--        @canplay="handleEvent($event)" -->
      <!--        @canplaythrough="handleEvent($event)" -->
      <!--        @timeupdate="handleEvent(player?.currentTime())" -->
    </Modal>
  </div>
</template>
