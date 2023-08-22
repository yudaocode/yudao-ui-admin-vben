<script lang="ts" setup>
import BenzAMRRecorder from 'benz-amr-recorder'
import { ref } from 'vue'
import { Tag } from 'ant-design-vue'

defineOptions({ name: 'WxVoicePlayer' })

const props = defineProps({
  url: {
    type: String, // 语音地址，例如说：https://www.iocoder.cn/xxx.amr
    required: true,
  },
  content: {
    type: String, // 语音文本
    required: false,
  },
})

const amr = ref()
const playing = ref(false)
const duration = ref()
/** 处理点击，播放或暂停 */
function playVoice() {
  // 情况一：未初始化，则创建 BenzAMRRecorder
  if (amr.value === undefined) {
    amrInit()
    return
  }
  // 情况二：已经初始化，则根据情况播放或暂时
  if (amr.value.isPlaying())
    amrStop()
  else
    amrPlay()
}

/** 音频初始化 */
function amrInit() {
  amr.value = new BenzAMRRecorder()
  // 设置播放
  amr.value.initWithUrl(props.url).then(() => {
    amrPlay()
    duration.value = amr.value.getDuration()
  })
  // 监听暂停
  amr.value.onEnded(() => {
    playing.value = false
  })
}

/** 音频播放 */
function amrPlay() {
  playing.value = true
  amr.value.play()
}

/** 音频暂停 */
function amrStop() {
  playing.value = false
  amr.value.stop()
}
</script>

<template>
  <div class="wx-voice-div" @click="playVoice">
    <div>
      <Icon v-if="playing !== true" icon="ep:video-play" :size="32" />
      <Icon v-else icon="ep:video-pause" :size="32" />
      <span v-if="duration" class="amr-duration">{{ duration }} 秒</span>
    </div>
    <div v-if="content">
      <Tag type="success" size="small">
        语音识别
      </Tag>
      {{ content }}
    </div>
  </div>
</template>
