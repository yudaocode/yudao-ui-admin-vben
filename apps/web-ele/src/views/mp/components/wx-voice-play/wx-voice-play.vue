<script lang="ts" setup>
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

// 因为微信语音是 amr 格式，所以需要用到 amr 解码器：https://www.npmjs.com/package/benz-amr-recorder
import BenzAMRRecorder from 'benz-amr-recorder';

/** 微信消息 - 语音 */
defineOptions({ name: 'VoicePlayer' });

const props = withDefaults(
  defineProps<{
    content?: string; // 语音文本
    url: string; // 语音地址，例如说：https://www.iocoder.cn/xxx.amr
  }>(),
  {
    content: '',
  },
);

const amr = ref();
const playing = ref(false);
const duration = ref();

/** 处理点击，播放或暂停 */
const playVoice = () => {
  // 情况一：未初始化，则创建 BenzAMRRecorder
  if (amr.value === undefined) {
    amrInit();
    return;
  }
  // 情况二：已经初始化，则根据情况播放或暂时
  if (amr.value.isPlaying()) {
    amrStop();
  } else {
    amrPlay();
  }
};

/** 音频初始化 */
const amrInit = () => {
  amr.value = new BenzAMRRecorder();
  // 设置播放
  amr.value.initWithUrl(props.url).then(() => {
    amrPlay();
    duration.value = amr.value.getDuration();
  });
  // 监听暂停
  amr.value.onEnded(() => {
    playing.value = false;
  });
};

/** 音频播放 */
const amrPlay = () => {
  playing.value = true;
  amr.value.play();
};

/** 音频暂停 */
const amrStop = () => {
  playing.value = false;
  amr.value.stop();
};
// TODO 芋艿：下面样式有点问题
</script>

<template>
  <div class="wx-voice-div" @click="playVoice">
    <el-icon>
      <IconifyIcon
        v-if="playing !== true"
        icon="lucide:circle-play"
        :size="32"
      />
      <IconifyIcon v-else icon="lucide:circle-pause" :size="32" />
      <span class="amr-duration" v-if="duration">{{ duration }} 秒</span>
    </el-icon>
    <div v-if="content">
      <el-tag type="success" size="small">语音识别</el-tag>
      {{ content }}
    </div>
  </div>
</template>
<style lang="scss" scoped>
/** TODO @dylan：看看有没适合 tindwind 的哈。 */
.wx-voice-div {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 50px;
  padding: 5px;
  background-color: #eaeaea;
  border-radius: 10px;
}

.amr-duration {
  margin-left: 5px;
  font-size: 11px;
}
</style>
