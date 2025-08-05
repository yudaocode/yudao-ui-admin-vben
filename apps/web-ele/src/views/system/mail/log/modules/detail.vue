<script lang="ts" setup>
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

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
      <ElDescriptions :column="2" border :label-style="{ width: '140px' }">
        <ElDescriptionsItem label="编号">{{ formData?.id }}</ElDescriptionsItem>
        <ElDescriptionsItem label="创建时间">
          {{ formatDateTime(formData?.createTime || '') }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="发送邮箱">
          {{ formData?.fromMail }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="接收用户">
          <div
            v-if="formData?.userType && formData?.userId"
            class="flex items-center gap-1"
          >
            <DictTag :type="DICT_TYPE.USER_TYPE" :value="formData.userType" />
            <span>({{ formData.userId }})</span>
          </div>
          <div v-else>无</div>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="接收信息" :span="2">
          <div v-if="formData">
            <div v-if="formData.toMails && formData.toMails.length > 0">
              收件：{{ formData.toMails.join('、') }}
            </div>
            <div v-if="formData.ccMails && formData.ccMails.length > 0">
              抄送：{{ formData.ccMails.join('、') }}
            </div>
            <div v-if="formData.bccMails && formData.bccMails.length > 0">
              密送：{{ formData.bccMails.join('、') }}
            </div>
          </div>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="模板编号">
          {{ formData?.templateId }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="模板编码">
          {{ formData?.templateCode }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="邮件标题" :span="2">
          {{ formData?.templateTitle }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="邮件内容" :span="2">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="formData?.templateContent"></div>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="发送状态">
          <DictTag
            :type="DICT_TYPE.SYSTEM_MAIL_SEND_STATUS"
            :value="formData?.sendStatus"
          />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="发送时间">
          {{ formatDateTime(formData?.sendTime || '') }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="发送消息编号">
          {{ formData?.sendMessageId }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="发送异常">
          {{ formData?.sendException }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>
  </Modal>
</template>
