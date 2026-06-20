<script lang="ts" setup>
import { computed, onBeforeUnmount } from 'vue'

import { IconifyIcon as Icon } from '@vben/icons'
import { formatFileSize, openSafeUrl } from '@vben/utils'

import { Image } from 'ant-design-vue'

import { CardBubble } from '#/views/im/home/components/card'
import { useVoicePlayer } from '#/views/im/home/composables/useVoicePlayer'
import { MESSAGE_MERGE_PREVIEW_LINES } from '#/views/im/utils/config'
import { ImContentType } from '#/views/im/utils/constants'
import { summarizeMessageContent } from '#/views/im/utils/conversation'
import {
  type AudioMessage,
  type CardMessage,
  type FaceMessage,
  type FileMessage,
  getFileIconInfo,
  type ImageMessage,
  type MentionCandidate,
  type MergeMessage,
  parseMessage,
  parseTextSegments,
  type TextMessage,
  type VideoMessage
} from '#/views/im/utils/message'
import { formatSeconds } from '#/views/im/utils/time'

import MaterialBubble from './material-bubble.vue'
import TipSegments from './tip-segments.vue'

defineOptions({ name: 'ImMessageBubble' })

const props = defineProps<{
  /** 消息 content（JSON 字符串） */
  content: string
  /** TEXT 气泡的 @ mention 候选名字；不传则文本里的 @xxx 退化为普通文本 */
  mentions?: MentionCandidate[]
  /** 是否自己发送，影响气泡配色（绿底 vs 灰底） */
  selfSend?: boolean
  /** 内容类型，对齐 ImContentType */
  type: number
  /** 媒体上传进度（0-100）；非 null 即视为上传中，渲染遮罩 / 进度条 */
  uploadProgress?: null | number
}>()

const emit = defineEmits<{
  /** 名片点击：调用方决定弹卡片 / 跳群等行为 */
  clickCard: [card: CardMessage, e: MouseEvent]
  /** 合并消息气泡点击：调用方决定开 dialog 或栈内 push */
  openMerge: [content: string]
}>()

/** 各 type 判定 */
const isText = computed(() => props.type === ImContentType.TEXT)
const isImage = computed(() => props.type === ImContentType.IMAGE)
const isFile = computed(() => props.type === ImContentType.FILE)
const isVoice = computed(() => props.type === ImContentType.VOICE)
const isVideo = computed(() => props.type === ImContentType.VIDEO)
const isFace = computed(() => props.type === ImContentType.FACE)
const isCard = computed(() => props.type === ImContentType.CARD)
const isMerge = computed(() => props.type === ImContentType.MERGE)
const isMaterial = computed(() => props.type === ImContentType.MATERIAL)

/** 媒体上传中：uploadProgress 非 null 即视为上传中 */
const isUploading = computed(() => props.uploadProgress != null)
const uploadProgress = computed(() => props.uploadProgress ?? 0)
const uploadProgressText = computed(() => `${uploadProgress.value}%`)

/**
 * 单一 parse 入口：content 一变只 parse 一次，按 type 分发到下面 7 个 payload
 *
 * 各类型 payload 共用同一棵 JSON 树，避免 7 个 computed 各自重 parse 同一份 content
 */
const parsedContent = computed<unknown>(() => parseMessage(props.content))

const textPayload = computed(() =>
  isText.value ? (parsedContent.value as null | TextMessage) : null
)

/** 文本气泡 segment 数组：mention 高亮 + URL 自动识别 + 普通文本三段拼接 */
const textSegments = computed(() => {
  const content = textPayload.value?.content
  if (!content) {
    return []
  }
  return parseTextSegments(content, props.mentions || [])
})
const imagePayload = computed(() =>
  isImage.value ? (parsedContent.value as ImageMessage | null) : null
)
const filePayload = computed(() =>
  isFile.value ? (parsedContent.value as FileMessage | null) : null
)
const voicePayload = computed(() =>
  isVoice.value ? (parsedContent.value as AudioMessage | null) : null
)
const videoPayload = computed(() =>
  isVideo.value ? (parsedContent.value as null | VideoMessage) : null
)
const cardPayload = computed(() =>
  isCard.value ? (parsedContent.value as CardMessage | null) : null
)
const mergePayload = computed(() =>
  isMerge.value ? (parsedContent.value as MergeMessage | null) : null
)

/** 合并消息内嵌前 N 条派生「{昵称}：{摘要}」 */
const mergePreviewLines = computed(() => {
  if (!mergePayload.value) {
    return []
  }
  return mergePayload.value.messages
    .slice(0, MESSAGE_MERGE_PREVIEW_LINES)
    .map((item) => `${item.senderNickname}：${summarizeMessageContent(item)}`)
})

const FACE_DIMENSION_MAX = 2048 // 表情 payload：非法宽高派生成 undefined，让 <img> 走 CSS max-w / max-h 兜底
const facePayload = computed(() => {
  if (!isFace.value) {
    return null
  }
  const raw = parsedContent.value as FaceMessage | null
  if (!raw) {
    return null
  }
  const sanitize = (v: number | undefined) =>
    v && v > 0 && v <= FACE_DIMENSION_MAX ? v : undefined
  return { ...raw, width: sanitize(raw.width), height: sanitize(raw.height) }
})

/** 文件图标 + 配色：按扩展名分发 */
const fileIconInfo = computed(() => getFileIconInfo(filePayload.value?.name))

/** 文本 / 文件 / 语音气泡的整体 class（含 selfSend 配色 + ::before 三角的 side class） */
function bubbleClass(variant: 'file' | 'text' | 'voice'): string[] {
  const isSelf = props.selfSend
  const side = isSelf ? 'message-bubble--self' : 'message-bubble--other'
  switch (variant) {
    case 'file': {
      return [
        side,
        'message-bubble--file',
        isSelf
          ? 'bg-[#95ec69] border-[var(--ant-color-border-secondary)]'
          : 'bg-[var(--ant-color-bg-container)] border-[var(--ant-color-border-secondary)] hover:border-[#409eff]'
      ]
    }
    case 'text': {
      return [
        side,
        'message-bubble--text',
        isSelf
          ? 'text-black bg-[#95ec69]'
          : 'text-[var(--ant-color-text)]'
      ]
    }
    case 'voice': {
      return [side, 'message-bubble--voice', isSelf ? 'bg-[#95ec69]' : '']
    }
  }
}

/** 文件点击 → 新窗口下载；上传中跳过 */
function handleFileClick() {
  if (isUploading.value || !filePayload.value?.url) {
    return
  }
  openSafeUrl(filePayload.value.url)
}

const voicePlayer = useVoicePlayer() // 语音点击：托管给 useVoicePlayer 全局互斥播放，新点的语音会停掉旧的
/**
 * 实例级唯一播放 key：每个 MessageBubble 实例独立一份
 *
 * 不用 url 当 key 是为了避免「主面板 / 历史抽屉 / 合并详情同一条语音」共享身份：那样三处气泡会
 * 同时显示播放态，且任何一处卸载都会 stop 掉别处仍可见的播放
 */
const voiceKey = Symbol('im-message-bubble-voice')
const voicePlaying = computed(() => voicePlayer.isPlaying(voiceKey))
function handleVoiceClick() {
  const url = voicePayload.value?.url
  if (!url) {
    return
  }
  voicePlayer.play(voiceKey, url)
}

/** 气泡卸载兜底：传 key 让 stop 自己判别「是不是我」，不会误伤别人的播放 */
onBeforeUnmount(() => {
  voicePlayer.stop(voiceKey)
})
</script>

<template>
  <!-- 文本：按 segment 渲染，mention 高亮可点击、URL 自动识别成可点击链接 -->
  <div
    v-if="isText && textPayload"
    class="relative px-3.5 py-2.5 text-sm leading-normal break-words whitespace-pre-wrap rounded-lg"
    :class="bubbleClass('text')"
  >
    <TipSegments :segments="textSegments" />
  </div>

  <!-- 图片：el-image 内置预览；上传中半透明遮罩 -->
  <div v-else-if="isImage && imagePayload" class="relative inline-block">
    <Image
      class="max-w-[220px] rounded cursor-zoom-in"
      :src="imagePayload.thumbnailUrl || imagePayload.url"
      :preview="isUploading ? false : { src: imagePayload.url }"
    />
    <div
      v-if="isUploading"
      class="absolute inset-0 flex items-center justify-center text-sm text-white bg-black bg-opacity-45 rounded pointer-events-none"
    >
      {{ uploadProgressText }}
    </div>
  </div>

  <!-- 文件：文件名 + 大小靠左、彩色大图标贴右；上传中插一条进度条 -->
  <div
    v-else-if="isFile && filePayload"
    class="relative flex gap-3 items-center min-w-[260px] max-w-[340px] px-3.5 py-3 border border-solid rounded transition-colors"
    :class="[bubbleClass('file'), isUploading ? 'cursor-default' : 'cursor-pointer']"
    @click="handleFileClick"
  >
    <div class="flex-1 min-w-0">
      <div class="overflow-hidden text-sm font-medium truncate text-[var(--ant-color-text)]">
        {{ filePayload.name }}
      </div>
      <div class="mt-1 text-12px text-[var(--ant-color-text-secondary)]">
        {{ formatFileSize(filePayload.size) }}
      </div>
      <div v-if="isUploading" class="flex gap-2 items-center mt-1.5">
        <div class="overflow-hidden flex-1 h-1 rounded bg-[var(--ant-color-fill-dark)]">
          <div
            class="h-full bg-[var(--ant-color-primary)] transition-[width] duration-150"
            :style="{ width: `${uploadProgress }%` }"
          ></div>
        </div>
        <span class="text-11px text-[var(--ant-color-text-secondary)] tabular-nums">
          {{ uploadProgressText }}
        </span>
      </div>
    </div>
    <Icon :icon="fileIconInfo.icon" :color="fileIconInfo.color" :size="40" class="flex-shrink-0" />
  </div>

  <!-- 语音 -->
  <div
    v-else-if="isVoice && voicePayload"
    class="relative flex gap-2 items-center min-w-[120px] px-3.5 py-2.5 rounded-lg cursor-pointer"
    :class="bubbleClass('voice')"
    @click="handleVoiceClick"
  >
    <Icon
      icon="ant-design:audio-outlined"
      :size="18"
      class="message-bubble__voice-icon"
      :class="{ 'im-voice-playing': voicePlaying }"
    />
    <span class="text-13px text-[var(--ant-color-text)]">
      {{ formatSeconds(voicePayload.duration) }}
    </span>
  </div>

  <!-- 视频：原生 controls 内嵌播放，poster 走后端封面；上传中半透明遮罩 -->
  <div v-else-if="isVideo && videoPayload?.url" class="relative inline-block">
    <video
      class="max-w-[280px] max-h-[320px] rounded bg-black"
      :src="videoPayload.url"
      :poster="videoPayload.coverUrl"
      :controls="!isUploading"
      preload="metadata"
    ></video>
    <div
      v-if="isUploading"
      class="absolute inset-0 flex items-center justify-center text-sm text-white bg-black bg-opacity-45 rounded pointer-events-none"
    >
      {{ uploadProgressText }}
    </div>
  </div>
  <!-- 视频但 payload 解析失败 / 没 url：降级展示 -->
  <div
    v-else-if="isVideo"
    class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--ant-color-text-secondary)] bg-[var(--ant-color-fill-secondary)]"
  >
    [视频消息]
  </div>

  <!-- 表情贴图：裸 <img> 不套气泡 -->
  <div v-else-if="isFace && facePayload" class="inline-block">
    <img
      :src="facePayload.url"
      :alt="facePayload.name || '表情'"
      :title="facePayload.name || ''"
      :width="facePayload.width"
      :height="facePayload.height"
      class="block max-w-[160px] max-h-[160px] object-contain"
      draggable="false"
    />
  </div>

  <!-- 名片 -->
  <CardBubble
    v-else-if="isCard && cardPayload"
    :card="cardPayload"
    clickable
    @click="(e: MouseEvent) => emit('clickCard', cardPayload!, e)"
  />

  <!-- 合并转发气泡：title + 摘要预览 + 底部「聊天记录」标签 -->
  <div
    v-else-if="isMerge && mergePayload"
    class="flex flex-col w-[260px] rounded-md overflow-hidden cursor-pointer bg-[var(--ant-color-bg-container)] border border-solid border-[var(--ant-color-border)] hover:border-[#409eff]"
    @click="emit('openMerge', content)"
  >
    <div class="px-3 py-2 text-sm font-medium text-[var(--ant-color-text)] truncate">
      {{ mergePayload.title }}
    </div>
    <div class="flex flex-col gap-0.5 px-3 pb-2">
      <div
        v-for="(line, idx) in mergePreviewLines"
        :key="idx"
        class="text-12px text-[var(--ant-color-text-secondary)] truncate"
      >
        {{ line }}
      </div>
    </div>
    <div
      class="px-3 py-1 text-12px border-t border-t-solid text-[var(--ant-color-text-placeholder)] border-[var(--ant-color-border-secondary)] bg-[var(--ant-color-fill-tertiary)]"
    >
      聊天记录
    </div>
  </div>
  <!-- 合并消息解析失败兜底 -->
  <div
    v-else-if="isMerge"
    class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--ant-color-text-secondary)] bg-[var(--ant-color-fill-secondary)]"
  >
    [聊天记录]
  </div>

  <!-- 频道素材：图文卡片，点击拉富文本 / 跳外链 -->
  <MaterialBubble v-else-if="isMaterial" :content="props.content" />

  <!-- 未知类型降级 -->
  <div
    v-else
    class="px-3.5 py-2.5 text-sm italic rounded-lg text-[var(--ant-color-text-secondary)] bg-[var(--ant-color-fill-secondary)]"
  >
    [不支持的内容类型]
  </div>
</template>

<style scoped>
/* 气泡尾巴小三角指向对应头像（对方在左、自己在右）；走 ::before + 4 边 border 配色画：透明 3 边 + 实色 1 边，
   颜色与气泡背景对应，留 1px 视觉吃进去，省一张图片 */
.message-bubble--other::before,
.message-bubble--self::before {
  content: '';
  position: absolute;
  top: 12px;
  width: 0;
  height: 0;
  border-style: solid;
}
.message-bubble--other {
  --im-message-bubble-other-bg: #f5f5f5;
}
.message-bubble--other.message-bubble--text,
.message-bubble--other.message-bubble--voice {
  background-color: var(--im-message-bubble-other-bg);
}
.message-bubble--other::before {
  left: -5px;
  border-width: 5px 6px 5px 0;
  border-color: transparent var(--im-message-bubble-other-bg) transparent transparent;
}
.message-bubble--self::before {
  right: -5px;
  border-width: 5px 0 5px 6px;
  border-color: transparent transparent transparent #95ec69;
}

/* 整体放进 :global()，避免 Vue scoped 把 `:global(.dark) .xxx` 塌缩成裸 `.dark` 而把变量刷到 <html> */
:global(.dark .message-bubble--other) {
  --im-message-bubble-other-bg: rgb(255 255 255 / 12%);
}

/* :deep 穿透 scoped 子组件 DOM；el-icon 在暗色模式下全局 color 被 .el-icon{color:var(--color)} 干扰，把 voice 图标 fill 锁死 */
.message-bubble__voice-icon :deep(svg) {
  fill: #606266 !important;
}
.message-bubble__voice-icon.im-voice-playing :deep(svg) {
  fill: #409eff !important;
}

/* @keyframes 需要 SCSS 声明；播放中的脉冲动画 */
.im-voice-playing {
  animation: im-voice-icon-pulse 0.8s infinite;
}

@keyframes im-voice-icon-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}
</style>
