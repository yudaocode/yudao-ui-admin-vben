<script lang="ts" setup>
import type { OaMailMessageApi } from '#/api/oa/mail/message';

import { computed, ref, watch } from 'vue';

import { downloadFileFromBlobPart, formatDate } from '@vben/utils';

import { Button, Empty } from 'antdv-next';

import { downloadMailMessageAttachment } from '#/api/oa/mail/message';
import {
  OA_MAIL_COMPOSE_MODE,
  OA_MAIL_FOLDER_KEY,
} from '#/views/oa/utils/constants';

/** 邮件详情 */
defineOptions({ name: 'OaMailMessageDetail' });

const props = defineProps<{
  detail?: OaMailMessageApi.MailMessage;
  detailError: string;
  folderKey: string;
  operating: boolean;
}>();
const emit = defineEmits<{
  compose: [mode: string];
  delete: [];
  read: [];
  restore: [];
}>();

const downloadingPart = ref(''); // 下载中的附件部分
const showExternalImages = ref(false); // 用户选择后加载邮件外部图片

// 切换邮件时复位外部图片加载
watch(
  () => props.detail?.id,
  () => {
    showExternalImages.value = false;
  },
);

/** 下载邮件附件 */
async function downloadAttachment(part: string, name: string) {
  if (!props.detail?.id) {
    return;
  }
  downloadingPart.value = part;
  try {
    const data = await downloadMailMessageAttachment(props.detail.id, part);
    downloadFileFromBlobPart({ fileName: name, source: data });
  } finally {
    downloadingPart.value = '';
  }
}

// 邮件正文使用独立沙箱，链接在新窗口打开，外部图片由用户选择加载
const mailHtml = computed(
  () =>
    `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data: ${showExternalImages.value ? 'http: https:' : ''}; base-uri &#39;none&#39;; form-action &#39;none&#39;"><base target="_blank"><style>body{font:14px/1.7 sans-serif;padding:20px;overflow-wrap:anywhere}table,img{max-width:100%}pre{white-space:pre-wrap}</style></head><body>` +
    (props.detail?.content || '') +
    '</body></html>',
);
</script>

<template>
  <div v-if="detail" class="flex h-full flex-col">
    <div class="shrink-0 border-b border-border px-4 py-3">
      <h2 class="m-0 break-words text-lg">
        {{ detail.subject || '（无主题）' }}
      </h2>
      <div class="mt-3 break-words text-[13px] leading-6 text-muted-foreground">
        <div>发件人：{{ detail.sender }}</div>
        <div>收件人：{{ detail.recipients?.join(', ') }}</div>
        <div v-if="detail.ccs?.length">抄送人：{{ detail.ccs?.join(', ') }}</div>
        <div>时间：{{ formatDate(detail.receiveTime) }}</div>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <Button
          type="primary"
          :disabled="operating"
          @click="emit('compose', OA_MAIL_COMPOSE_MODE.REPLY)"
        >
          回复
        </Button>
        <Button
          :disabled="operating"
          @click="emit('compose', OA_MAIL_COMPOSE_MODE.REPLY_ALL)"
        >
          回复全部
        </Button>
        <Button
          :disabled="operating"
          @click="emit('compose', OA_MAIL_COMPOSE_MODE.FORWARD)"
        >
          转发
        </Button>
        <Button :loading="operating" @click="emit('read')">
          {{ detail.readStatus ? '标记未读' : '标记已读' }}
        </Button>
        <Button v-if="!showExternalImages" @click="showExternalImages = true">
          显示外部图片
        </Button>
        <Button
          v-if="folderKey === OA_MAIL_FOLDER_KEY.TRASH"
          :disabled="operating"
          @click="emit('restore')"
        >
          恢复到收件箱
        </Button>
        <Button danger :disabled="operating" @click="emit('delete')">
          {{ folderKey === OA_MAIL_FOLDER_KEY.TRASH ? '彻底删除' : '删除' }}
        </Button>
      </div>
      <div v-if="detail.attachments?.length" class="mt-3 text-[13px]">
        <span>附件：</span>
        <Button
          v-for="attachment in detail.attachments"
          :key="attachment.part"
          :loading="downloadingPart === attachment.part"
          size="small"
          type="link"
          @click="downloadAttachment(attachment.part, attachment.name)"
        >
          {{ attachment.name }}
        </Button>
      </div>
    </div>
    <!-- 正文沿用邮件自身排版，外层不叠加内边距 -->
    <iframe
      title="邮件正文"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      referrerpolicy="no-referrer"
      :srcdoc="mailHtml"
      class="min-h-0 w-full flex-1 border-0"
    >
    </iframe>
  </div>
  <Empty v-else :description="detailError || '请选择邮件'" class="mt-20" />
</template>
