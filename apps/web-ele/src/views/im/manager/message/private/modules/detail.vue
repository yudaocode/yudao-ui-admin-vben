<script lang="ts" setup>
import type { ImManagerPrivateMessageApi } from '#/api/im/manager/message/private';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { ElDescriptions, ElDescriptionsItem, ElDialog } from 'element-plus';

import { DictTag } from '#/components/dict-tag';
import {
  formatDateTimeText,
  formatJsonText,
  formatUserLabel,
} from '#/views/im/manager/utils/format';
import { MESSAGE_PRIVATE_READ_ENABLED } from '#/views/im/utils/config';

import { MessageContentPreview } from '../..';

const visible = ref(false);
const detail = ref<ImManagerPrivateMessageApi.PrivateMessage>(
  {} as ImManagerPrivateMessageApi.PrivateMessage,
);

/** 打开详情 */
function open(row: ImManagerPrivateMessageApi.PrivateMessage) {
  detail.value = row;
  visible.value = true;
}

defineExpose({ open });
</script>

<template>
  <ElDialog v-model="visible" title="私聊消息详情" width="700px">
    <ElDescriptions border :column="2">
      <ElDescriptionsItem label="编号">{{ detail.id }}</ElDescriptionsItem>
      <ElDescriptionsItem label="客户端编号">
        {{ detail.clientMessageId || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发送人">
        {{ formatUserLabel(detail.senderNickname, detail.senderId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="接收人">
        {{ formatUserLabel(detail.receiverNickname, detail.receiverId) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="类型">
        <DictTag :type="DICT_TYPE.IM_CONTENT_TYPE" :value="detail.type" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="状态">
        <DictTag :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="detail.status" />
      </ElDescriptionsItem>
      <ElDescriptionsItem v-if="MESSAGE_PRIVATE_READ_ENABLED" label="回执">
        <!-- 回执状态（私聊 / 群聊共用 im_message_receipt_status），与源端私聊详情「回执」对齐 -->
        <DictTag
          :type="DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS"
          :value="detail.receiptStatus"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发送时间" :span="2">
        {{ formatDateTimeText(detail.sendTime) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消息内容" :span="2">
        <MessageContentPreview
          :content="detail.content"
          :sender-nickname="detail.senderNickname"
          :type="detail.type"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="原始 JSON" :span="2">
        <pre
          class="m-0 whitespace-pre-wrap break-all rounded bg-gray-100 p-2 font-mono text-xs"
        >
          {{ formatJsonText(detail.content) }}
        </pre>
      </ElDescriptionsItem>
    </ElDescriptions>
  </ElDialog>
</template>
