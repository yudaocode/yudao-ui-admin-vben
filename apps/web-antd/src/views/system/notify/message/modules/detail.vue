<script lang="ts" setup>
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { useVbenModal } from '@vben/common-ui';
import { Descriptions, Tag } from 'ant-design-vue';

import { ref } from 'vue';
import { formatDateTime } from '@vben/utils';
import { DICT_TYPE, getDictLabel } from '#/utils/dict';

const messageData = ref<SystemNotifyMessageApi.SystemNotifyMessage>();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<SystemNotifyMessageApi.SystemNotifyMessage>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      messageData.value = data;
    } finally {
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal title="站内信详情" class="w-1/2">
    <Descriptions bordered :column="1" size="middle" class="mx-4">
      <Descriptions.Item label="编号">{{ messageData?.id }}</Descriptions.Item>
      <Descriptions.Item label="用户类型">
        <!-- TODO @芋艿: 数据字典-->
        <Tag color="processing">
          {{ getDictLabel(DICT_TYPE.USER_TYPE, messageData?.userType) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="用户编号">
        {{ messageData?.userId }}
      </Descriptions.Item>
      <Descriptions.Item label="模版编号">
        {{ messageData?.templateId }}
      </Descriptions.Item>
      <Descriptions.Item label="模板编码">
        {{ messageData?.templateCode }}
      </Descriptions.Item>
      <Descriptions.Item label="发送人名称">
        {{ messageData?.templateNickname }}
      </Descriptions.Item>
      <Descriptions.Item label="模版内容">
        {{ messageData?.templateContent }}
      </Descriptions.Item>
      <Descriptions.Item label="模版参数">
        {{ messageData?.templateParams }}
      </Descriptions.Item>
      <Descriptions.Item label="模版类型">
        <!-- TODO @芋艿: 数据字典-->
        <Tag color="processing">
          {{ getDictLabel(DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE, messageData?.templateType) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="是否已读">
        <!-- TODO @芋艿: 数据字典-->
        <Tag color="processing">
          {{ getDictLabel(DICT_TYPE.INFRA_BOOLEAN_STRING, messageData?.readStatus) }}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="阅读时间">
        {{ formatDateTime(messageData?.readTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {{ formatDateTime(messageData?.createTime || '') }}
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
