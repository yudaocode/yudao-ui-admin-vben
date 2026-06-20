<script lang="ts" setup>
import { computed } from 'vue';

import { getDictObj } from '@vben/hooks';
import { IconifyIcon } from '@vben/icons';
import { formatFileSize, openSafeUrl } from '@vben/utils';

import { Image } from 'ant-design-vue';

import { CardLineLabel } from '#/views/im/home/components/card';
import { MESSAGE_MERGE_PREVIEW_LINES } from '#/views/im/utils/config';
import {
  ImContentType,
  ImRtcCallEndReason,
  ImRtcCallMediaType,
  isFriendChatTip,
  isGroupNotification,
  isRtcCallTip,
} from '#/views/im/utils/constants';
import {
  buildFacePreviewText,
  summarizeMessageContent,
} from '#/views/im/utils/conversation';
import {
  getFileIconInfo,
  parseMessage,
  parseRtcCallPayload,
  resolveFriendNotificationText,
  resolveGroupNotificationText,
} from '#/views/im/utils/message';
import { formatSeconds } from '#/views/im/utils/time';

defineOptions({ name: 'ImManagerMessageContentPreview' });

const props = defineProps<{
  content?: string;
  senderNickname?: string;
  type?: number;
}>();

const payload = computed<null | Record<string, any>>(() =>
  parseMessage<Record<string, any>>(props.content ?? ''),
);

const textContent = computed(() => payload.value?.content || '');

const fileIconInfo = computed(() => getFileIconInfo(payload.value?.name));

const cardPayload = computed(() => {
  if (props.type !== ImContentType.CARD || !payload.value) {
    return undefined;
  }
  return {
    ...payload.value,
    name: payload.value.name || payload.value.nickname || payload.value.userId || '',
  };
});

const mergePreviewLines = computed(() => {
  const messages = payload.value?.messages;
  if (!Array.isArray(messages)) {
    return [];
  }
  return messages
    .slice(0, MESSAGE_MERGE_PREVIEW_LINES)
    .map((item) => `${item.senderNickname}：${summarizeMessageContent(item)}`);
});

const fallbackText = computed(() => {
  const raw = props.content || '';
  if (!raw) {
    return '';
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.content) {
      return String(parsed.content);
    }
  } catch {}
  return raw;
});

const friendTipText = computed(() =>
  resolveFriendNotificationText({ type: props.type }),
);

const groupTipText = computed(() =>
  resolveGroupNotificationText(
    { type: props.type, content: props.content },
    (id) => `用户(${id})`,
    props.senderNickname,
  ),
);

const rtcCallTipText = computed(() => {
  const rtcPayload = parseRtcCallPayload(props.content);
  if (!rtcPayload) {
    return '';
  }
  const mediaLabel =
    rtcPayload.mediaType === ImRtcCallMediaType.VIDEO ? '视频' : '语音';
  if (props.type === ImContentType.RTC_CALL_START) {
    const inviter =
      rtcPayload.inviterNickname?.trim() ||
      `用户(${rtcPayload.inviterUserId ?? ''})`;
    return `${inviter} 发起了${mediaLabel}通话`;
  }
  const segments = [`${mediaLabel}通话已结束`];
  if (
    rtcPayload.endReason &&
    rtcPayload.endReason !== ImRtcCallEndReason.HANGUP
  ) {
    const reason = getDictObj(
      'im_rtc_call_end_reason',
      String(rtcPayload.endReason),
    )?.label;
    if (reason) {
      segments.push(reason);
    }
  }
  const duration = rtcPayload.durationSeconds ?? 0;
  if (duration > 0) {
    segments.push(`时长 ${formatSeconds(duration)}`);
  }
  return segments.join('，');
});

/** 打开视频 */
function openVideo() {
  openSafeUrl(payload.value?.url);
}
</script>

<template>
  <span v-if="type === ImContentType.TEXT" class="whitespace-pre-wrap break-all">
    {{ textContent }}
  </span>

  <Image
    v-else-if="type === ImContentType.IMAGE && payload"
    :height="60"
    :src="payload.thumbnailUrl || payload.url"
    :width="60"
  />

  <span
    v-else-if="type === ImContentType.FILE && payload"
    class="inline-flex items-center gap-1.5"
  >
    <IconifyIcon
      :color="fileIconInfo.color"
      :icon="fileIconInfo.icon"
      class="size-4"
    />
    <span class="max-w-52 truncate">{{ payload.name }}</span>
    <span v-if="payload.size > 0" class="text-xs text-gray-400">
      {{ formatFileSize(payload.size) }}
    </span>
  </span>

  <span
    v-else-if="type === ImContentType.VOICE && payload"
    class="inline-flex items-center gap-1.5"
  >
    <IconifyIcon class="size-4" icon="ant-design:audio-outlined" />
    <span>{{ formatSeconds(payload.duration || 0) }}</span>
  </span>

  <span
    v-else-if="type === ImContentType.VIDEO && payload"
    class="inline-flex items-center gap-1.5"
  >
    <button
      v-if="payload.coverUrl"
      class="relative size-[60px] overflow-hidden rounded border-0 p-0"
      type="button"
      @click="openVideo"
    >
      <img :src="payload.coverUrl" class="size-full object-cover" />
      <IconifyIcon
        class="absolute inset-0 m-auto size-6 text-white drop-shadow"
        icon="ant-design:play-circle-filled"
      />
    </button>
    <span v-else class="inline-flex items-center gap-1.5">
      <IconifyIcon class="size-4" icon="ant-design:video-camera-filled" />
      <span>[视频]</span>
    </span>
    <span v-if="payload.duration" class="text-xs text-gray-400">
      {{ formatSeconds(payload.duration) }}
    </span>
    <span v-if="payload.size > 0" class="text-xs text-gray-400">
      {{ formatFileSize(payload.size) }}
    </span>
  </span>

  <CardLineLabel
    v-else-if="type === ImContentType.CARD && cardPayload"
    :card="cardPayload"
    :icon-size="16"
  />

  <span
    v-else-if="type === ImContentType.FACE && payload"
    class="inline-flex items-center gap-1.5"
  >
    <img
      v-if="payload.url"
      :alt="payload.name || '表情'"
      :src="payload.url"
      class="size-[30px] rounded object-contain"
      draggable="false"
    />
    <span>{{ buildFacePreviewText(payload) }}</span>
  </span>

  <span
    v-else-if="type === ImContentType.MERGE && payload"
    class="inline-flex flex-col gap-0.5 align-middle"
  >
    <span>[聊天记录] {{ payload.title }}</span>
    <span
      v-for="(line, index) in mergePreviewLines"
      :key="index"
      class="truncate text-xs text-gray-400"
    >
      {{ line }}
    </span>
  </span>

  <span v-else-if="type === ImContentType.RECALL" class="text-xs text-gray-400">
    [消息已撤回]
  </span>
  <span v-else-if="type === ImContentType.READ" class="text-xs text-gray-400">
    [已读回执]
  </span>
  <span v-else-if="type === ImContentType.RECEIPT" class="text-xs text-gray-400">
    [回执]
  </span>
  <span v-else-if="isGroupNotification(type ?? -1)" class="text-xs text-gray-400">
    {{ groupTipText }}
  </span>
  <span v-else-if="isFriendChatTip(type ?? -1)" class="text-xs text-gray-400">
    {{ friendTipText }}
  </span>
  <span
    v-else-if="isRtcCallTip(type ?? -1)"
    class="inline-flex items-center gap-1.5 text-xs text-gray-400"
  >
    <IconifyIcon class="size-4 rotate-[135deg]" icon="ant-design:phone-outlined" />
    <span>{{ rtcCallTipText }}</span>
  </span>
  <span v-else class="whitespace-pre-wrap break-all">{{ fallbackText }}</span>
</template>
