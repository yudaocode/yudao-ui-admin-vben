<script lang="ts" setup>
import type { ImManagerPrivateMessageVO } from '#/api/im/manager/message/private';

import { ref } from 'vue';

import { DICT_TYPE } from '@vben/constants';

import { Descriptions, DescriptionsItem, Modal } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import {
  formatDateTimeText,
  formatJsonText,
  formatUserLabel,
} from '#/views/im/manager/utils/format';
import { MESSAGE_PRIVATE_READ_ENABLED } from '#/views/im/utils/config';

import MessageContentPreview from '../../MessageContentPreview.vue';

const visible = ref(false);
const detail = ref<ImManagerPrivateMessageVO>(
  {} as ImManagerPrivateMessageVO,
);

/** 打开详情 */
function open(row: ImManagerPrivateMessageVO) {
  detail.value = row;
  visible.value = true;
}

defineExpose({ open });
</script>

<template>
  <Modal v-model:open="visible" :footer="null" title="私聊消息详情" width="700px">
    <Descriptions bordered :column="2">
      <DescriptionsItem label="编号">{{ detail.id }}</DescriptionsItem>
      <DescriptionsItem label="客户端编号">
        {{ detail.clientMessageId || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="发送人">
        {{ formatUserLabel(detail.senderNickname, detail.senderId) }}
      </DescriptionsItem>
      <DescriptionsItem label="接收人">
        {{ formatUserLabel(detail.receiverNickname, detail.receiverId) }}
      </DescriptionsItem>
      <DescriptionsItem label="类型">
        <DictTag :type="DICT_TYPE.IM_CONTENT_TYPE" :value="detail.type" />
      </DescriptionsItem>
      <DescriptionsItem label="状态">
        <DictTag :type="DICT_TYPE.IM_MESSAGE_STATUS" :value="detail.status" />
      </DescriptionsItem>
      <DescriptionsItem v-if="MESSAGE_PRIVATE_READ_ENABLED" label="回执" :span="2">
        <DictTag
          :type="DICT_TYPE.IM_MESSAGE_RECEIPT_STATUS"
          :value="detail.receiptStatus"
        />
      </DescriptionsItem>
      <DescriptionsItem label="发送时间" :span="2">
        {{ formatDateTimeText(detail.sendTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="消息内容" :span="2">
        <MessageContentPreview
          :content="detail.content"
          :sender-nickname="detail.senderNickname"
          :type="detail.type"
        />
      </DescriptionsItem>
      <DescriptionsItem label="原始 JSON" :span="2">
        <pre class="m-0 whitespace-pre-wrap break-all rounded bg-gray-100 p-2 font-mono text-xs">{{ formatJsonText(detail.content) }}</pre>
      </DescriptionsItem>
    </Descriptions>
  </Modal>
</template>
