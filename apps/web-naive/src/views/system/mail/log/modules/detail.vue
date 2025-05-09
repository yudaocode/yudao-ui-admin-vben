<script lang="ts" setup>
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NDescriptions, NDescriptionsItem } from 'naive-ui';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

const formData = ref<SystemMailLogApi.MailLog>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemMailLogApi.MailLog>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = data;
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="邮件日志详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <div class="p-4">
      <NDescriptions :column="2" bordered :label-style="{ width: '140px' }">
        <NDescriptionsItem label="编号">{{ formData?.id }}</NDescriptionsItem>
        <NDescriptionsItem label="创建时间">
          {{ formatDateTime(formData?.createTime || '') }}
        </NDescriptionsItem>
        <NDescriptionsItem label="收件邮箱">
          {{ formData?.toMail }}
        </NDescriptionsItem>
        <NDescriptionsItem label="发送邮箱">
          {{ formData?.fromMail }}
        </NDescriptionsItem>
        <NDescriptionsItem label="用户编号">
          {{ formData?.userId }}
        </NDescriptionsItem>
        <NDescriptionsItem label="用户类型">
          {{ formData?.userType }}
        </NDescriptionsItem>
        <NDescriptionsItem label="模板编号">
          {{ formData?.templateId }}
        </NDescriptionsItem>
        <NDescriptionsItem label="模板编码">
          {{ formData?.templateCode }}
        </NDescriptionsItem>
        <NDescriptionsItem label="邮件标题" :span="2">
          {{ formData?.templateTitle }}
        </NDescriptionsItem>
        <NDescriptionsItem label="邮件内容" :span="2">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="formData?.templateContent"></div>
        </NDescriptionsItem>
        <NDescriptionsItem label="发送状态">
          <DictTag
            :type="DICT_TYPE.SYSTEM_MAIL_SEND_STATUS"
            :value="formData?.sendStatus"
          />
        </NDescriptionsItem>
        <NDescriptionsItem label="发送时间">
          {{ formatDateTime(formData?.sendTime || '') }}
        </NDescriptionsItem>
        <NDescriptionsItem label="发送消息编号">
          {{ formData?.sendMessageId }}
        </NDescriptionsItem>
        <NDescriptionsItem label="发送异常">
          {{ formData?.sendException }}
        </NDescriptionsItem>
      </NDescriptions>
    </div>
  </Modal>
</template>
