<script lang="ts" setup>
import { computed } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { getFileNameFromUrl, isImage } from '@vben/utils';

defineOptions({ name: 'BpmTaskEvidence' });

const props = withDefaults(
  defineProps<{
    attachments?: null | string | string[];
    compact?: boolean;
    emptyText?: string;
    reason?: string;
    reasonLabel?: string;
    signPicUrl?: null | string;
  }>(),
  {
    attachments: () => [],
    emptyText: '-',
    reason: '',
    reasonLabel: '审批意见',
    signPicUrl: '',
  },
);

const reasonText = computed(() => props.reason?.trim() || '');
const attachmentList = computed(() => normalizeAttachments(props.attachments)); // 附件列表
const signPicUrlValue = computed(() => props.signPicUrl?.trim() || ''); // 签名图片地址
const hasEvidence = computed(
  () =>
    !!reasonText.value ||
    attachmentList.value.length > 0 ||
    !!signPicUrlValue.value,
); // 是否存在审批凭证

/** 标准化附件列表 */
function normalizeAttachments(attachments?: null | string | string[]) {
  if (!attachments) {
    return [];
  }
  const list = Array.isArray(attachments)
    ? attachments
    : String(attachments).split(',');
  return list.map((item) => item.trim()).filter(Boolean);
}

/** 判断是否图片附件 */
function isImageAttachment(url: string) {
  return isImage(getFileNameFromUrl(url));
}
</script>

<template>
  <div
    v-if="hasEvidence"
    :class="
      compact
        ? 'flex flex-col items-center gap-1 text-xs text-gray-500'
        : 'mt-1 w-full rounded-md bg-gray-100 p-2 text-sm text-gray-500'
    "
  >
    <div v-if="reasonText" class="w-full">
      {{ reasonLabel }}：{{ reasonText }}
    </div>

    <div
      v-if="attachmentList.length > 0"
      class="w-full"
      :class="{
        'mt-2 border-t border-dashed border-gray-300 pt-2':
          reasonText && !compact,
      }"
    >
      <div v-if="!compact" class="mb-1 text-xs font-semibold text-gray-400">
        附件列表：
      </div>
      <div class="flex flex-wrap gap-1.5" :class="{ 'justify-center': compact }">
        <a
          v-for="attachment in attachmentList"
          :key="attachment"
          :href="attachment"
          target="_blank"
          class="inline-flex max-w-[220px] items-center gap-1 rounded border border-solid border-gray-200 bg-white px-2 py-1 text-blue-500 hover:text-blue-600 hover:underline"
          :title="getFileNameFromUrl(attachment)"
        >
          <img
            v-if="isImageAttachment(attachment)"
            :src="attachment"
            class="size-5 rounded object-cover"
          />
          <IconifyIcon v-else icon="lucide:file-text" class="text-gray-400" />
          <span class="truncate">{{ getFileNameFromUrl(attachment) }}</span>
        </a>
      </div>
    </div>

    <div
      v-if="signPicUrlValue"
      class="w-full"
      :class="{
        'mt-2 border-t border-dashed border-gray-300 pt-2':
          (reasonText || attachmentList.length) && !compact,
      }"
    >
      <div class="mb-1 text-xs font-semibold text-gray-400">签名：</div>
      <a :href="signPicUrlValue" target="_blank" title="查看签名">
        <img
          :src="signPicUrlValue"
          class="max-h-[60px] max-w-[180px] rounded border border-solid border-gray-200 bg-white object-contain"
        />
      </a>
    </div>
  </div>
  <span v-else-if="compact" class="text-gray-400">{{ emptyText }}</span>
</template>
