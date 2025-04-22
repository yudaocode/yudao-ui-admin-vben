<script lang="ts" setup>
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils/dict';

const formData = ref<SystemNotifyMessageApi.NotifyMessage>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
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
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal
    title="消息详情"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions bordered :column="1" size="middle" class="mx-4">
      <Descriptions.Item label="发送人">
        {{ formData?.templateNickname }}
      </Descriptions.Item>
      <!-- TODO @芋艿：报错 -->
      <Descriptions.Item label="发送时间">
        {{ formatDateTime(formData?.createTime) }}
      </Descriptions.Item>
      <Descriptions.Item label="消息类型">
        <DictTag
          :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE"
          :value="formData?.templateType"
        />
      </Descriptions.Item>
      <Descriptions.Item label="是否已读">
        <DictTag
          :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
          :value="formData?.readStatus"
        />
      </Descriptions.Item>
      <Descriptions.Item label="阅读时间">
        {{ formatDateTime(formData?.readTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="消息内容">
        {{ formData?.templateContent }}
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
