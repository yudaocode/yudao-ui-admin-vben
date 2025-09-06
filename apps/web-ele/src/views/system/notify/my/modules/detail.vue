<script lang="ts" setup>
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { formatDateTime } from '@vben/utils';

import { ElDescriptions, ElDescriptionsItem } from 'element-plus';

import { DictTag } from '#/components/dict-tag';

const formData = ref<SystemNotifyMessageApi.NotifyMessage>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemNotifyMessageApi.NotifyMessage>();
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
    title="站内信详情"
    class="w-1/3"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <ElDescriptions border :column="1" size="default" class="mx-4">
      <ElDescriptionsItem label="发送人">
        {{ formData?.templateNickname }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="发送时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消息类型">
        <DictTag
          :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE"
          :value="formData?.templateType"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="是否已读">
        <DictTag
          :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
          :value="formData?.readStatus"
        />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="阅读时间">
        {{ formatDateTime(formData?.readTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="消息内容">
        {{ formData?.templateContent }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
