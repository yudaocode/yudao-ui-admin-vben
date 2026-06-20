<script lang="ts" setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch
} from 'vue'

import { ElButton, ElMessage } from 'element-plus'

import { formatSeconds } from '#/views/im/utils/time'

defineOptions({ name: 'ImVoiceRecorder' })

const props = withDefaults(
  defineProps<{
    maxDuration?: number // 最长录制秒数
    modelValue: boolean // 是否显示
  }>(),
  {
    maxDuration: 60
  }
)

const emit = defineEmits<{
  send: [payload: { blob: Blob; duration: number; extension: string; mimeType: string }] // 录制完成数据
  'update:modelValue': [value: boolean]
}>()

const VOICE_MIME_TYPE_OPTIONS = [
  { extension: 'webm', mimeType: 'audio/webm;codecs=opus' },
  { extension: 'webm', mimeType: 'audio/webm' },
  { extension: 'm4a', mimeType: 'audio/mp4' },
  { extension: 'ogg', mimeType: 'audio/ogg;codecs=opus' },
  { extension: 'ogg', mimeType: 'audio/ogg' }
]

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const rootRef = useTemplateRef<HTMLDivElement>('rootRef')

/** 录制状态 */
type Status = 'idle' | 'preview' | 'recording'
const status = ref<Status>('idle')
const duration = ref(0)
const previewUrl = ref('')

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let mediaStream: MediaStream | null = null
let timer: null | ReturnType<typeof setInterval> = null
let recordedBlob: Blob | null = null
let discarding = false
let recordingMimeType = ''
let recordingExtension = ''
let recordedMimeType = ''
let recordedExtension = ''

/** 计时器文案 */
const timerText = computed(() => formatSeconds(duration.value))

/** 监听面板显示状态 */
watch(visible, (v) => {
  if (v) {
    document.addEventListener('click', handleDocumentClick)
  } else {
    document.removeEventListener('click', handleDocumentClick)
    resetAll()
  }
})

/** 处理外部点击 */
function handleDocumentClick(e: MouseEvent) {
  if (!props.modelValue || !rootRef.value) {
    return
  }
  if (rootRef.value.contains(e.target as Node)) {
    return
  }
  if (status.value !== 'idle') {
    return
  }
  visible.value = false
}

/** 获取支持的录音格式 */
function getSupportedVoiceMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined
  }
  return VOICE_MIME_TYPE_OPTIONS.find((item) => MediaRecorder.isTypeSupported(item.mimeType))
}

/** 获取录音文件后缀 */
function getVoiceExtension(mimeType: string) {
  const normalizedMimeType = mimeType.split(';')[0]
  if (normalizedMimeType === 'audio/mp4') {
    return 'm4a'
  }
  if (normalizedMimeType === 'audio/ogg') {
    return 'ogg'
  }
  return 'webm'
}

/** 创建录音器 */
function createVoiceRecorder(stream: MediaStream) {
  const supportedMimeType = getSupportedVoiceMimeType()
  const recorder = supportedMimeType
    ? new MediaRecorder(stream, { mimeType: supportedMimeType.mimeType })
    : new MediaRecorder(stream)
  recordingMimeType = recorder.mimeType || supportedMimeType?.mimeType || ''
  recordingExtension = supportedMimeType?.extension || (recordingMimeType ? getVoiceExtension(recordingMimeType) : '')
  return recorder
}

/** 开始录制 */
async function startRecord() {
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    ElMessage.error('当前浏览器不支持录音（需要 HTTPS 或 localhost）')
    return
  }
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    ElMessage.error('无法获取麦克风权限')
    return
  }
  audioChunks = []
  discarding = false
  try {
    mediaRecorder = createVoiceRecorder(mediaStream)
  } catch {
    cleanupStream()
    ElMessage.error('当前浏览器不支持录音格式')
    return
  }
  mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data)
    }
  })
  mediaRecorder.addEventListener('stop', () => {
    if (discarding) {
      return
    }
    recordedMimeType = recordingMimeType || mediaRecorder?.mimeType || audioChunks[0]?.type || 'audio/webm'
    recordedExtension = recordingExtension || getVoiceExtension(recordedMimeType)
    recordedBlob = new Blob(audioChunks, { type: recordedMimeType })
    previewUrl.value = URL.createObjectURL(recordedBlob)
    status.value = 'preview'
  })
  mediaRecorder.start()
  status.value = 'recording'
  duration.value = 0
  timer = setInterval(() => {
    duration.value++
    if (duration.value >= props.maxDuration) {
      stopRecord()
    }
  }, 1000)
}

/** 停止录制 */
function stopRecord() {
  if (duration.value < 1) {
    ElMessage.warning('录音时间太短')
    resetAll()
    return
  }
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  cleanupStream()
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 重新录制 */
function restart() {
  clearPreview()
  duration.value = 0
  status.value = 'idle'
}

/** 发送录音 */
function handleSend() {
  if (!recordedBlob) {
    return
  }
  emit('send', {
    blob: recordedBlob,
    duration: duration.value,
    extension: recordedExtension,
    mimeType: recordedMimeType || recordedBlob.type
  })
  visible.value = false
}

/** 取消录制 */
function handleCancel() {
  visible.value = false
}

/** 重置录制资源 */
function resetAll() {
  discarding = true
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  cleanupStream()
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  audioChunks = []
  duration.value = 0
  status.value = 'idle'
  recordingMimeType = ''
  recordingExtension = ''
  recordedMimeType = ''
  recordedExtension = ''
  clearPreview()
}

/** 释放预览音频 */
function clearPreview() {
  recordedBlob = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

/** 关闭麦克风采集 */
function cleanupStream() {
  mediaStream?.getTracks().forEach((t) => t.stop())
  mediaStream = null
}

onMounted(() => {
  if (props.modelValue) {
    document.addEventListener('click', handleDocumentClick)
  }
})

onBeforeUnmount(resetAll)

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <!-- 语音录制面板 -->
  <div
    v-if="visible"
    ref="rootRef"
    class="im-popover-arrow absolute z-100 w-80 p-4 rounded-md bg-[var(--ant-color-bg-container)] shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
    @click.stop
  >
    <div class="flex flex-col items-center gap-3">
      <!-- 录制时长 -->
      <div class="text-[28px] font-medium tabular-nums text-[var(--ant-color-text)]">
        {{ timerText }}
      </div>

      <!-- 状态文案 -->
      <div class="text-13px text-[var(--ant-color-text-secondary)]">
        <span v-if="status === 'idle'">点击下方按钮开始录制</span>
        <span v-else-if="status === 'recording'">录制中，最长 {{ maxDuration }} 秒</span>
        <span v-else>录制完成，可试听后发送</span>
      </div>

      <!-- 录制状态 -->
      <div
        v-if="status !== 'preview'"
        class="w-12 h-12 rounded-full bg-[var(--ant-color-border)]"
        :class="{ 'im-voice-recorder__pulse bg-[#f56c6c]': status === 'recording' }"
      ></div>
      <audio v-else :src="previewUrl" controls class="w-full"></audio>
    </div>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-2 mt-3">
      <template v-if="status === 'idle'">
        <ElButton size="small" @click="handleCancel">取消</ElButton>
        <ElButton size="small" type="primary" @click="startRecord">开始录制</ElButton>
      </template>
      <template v-else-if="status === 'recording'">
        <ElButton size="small" @click="handleCancel">取消</ElButton>
        <ElButton size="small" type="primary" @click="stopRecord">停止录制</ElButton>
      </template>
      <template v-else>
        <ElButton size="small" @click="handleCancel">取消</ElButton>
        <ElButton size="small" @click="restart">重新录制</ElButton>
        <ElButton size="small" type="primary" @click="handleSend">发送</ElButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* 底部小三角 */
.im-popover-arrow::after {
  content: '';
  position: absolute;
  top: calc(100% - 1px);
  left: 110px;
  border-style: solid;
  border-width: 6px 6px 0 6px;
  border-color: var(--ant-color-bg-container) transparent transparent transparent;
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.08));
}

/* 录音中的脉冲动画 */
.im-voice-recorder__pulse {
  animation: im-voice-pulse 1s infinite;
}

@keyframes im-voice-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.6);
  }
  70% {
    box-shadow: 0 0 0 20px rgba(245, 108, 108, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0);
  }
}
</style>
