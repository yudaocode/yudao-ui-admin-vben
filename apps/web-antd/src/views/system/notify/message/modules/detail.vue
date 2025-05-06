<script lang="ts" setup>
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions } from 'ant-design-vue';

import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

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
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions bordered :column="1" size="middle" class="mx-4">
      <Descriptions.Item label="编号">{{ formData?.id }}</Descriptions.Item>
      <Descriptions.Item label="用户类型">
        <DictTag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
      </Descriptions.Item>
      <Descriptions.Item label="用户编号">
        {{ formData?.userId }}
      </Descriptions.Item>
      <Descriptions.Item label="模版编号">
        {{ formData?.templateId }}
      </Descriptions.Item>
      <Descriptions.Item label="模板编码">
        {{ formData?.templateCode }}
      </Descriptions.Item>
      <Descriptions.Item label="发送人名称">
        {{ formData?.templateNickname }}
      </Descriptions.Item>
      <Descriptions.Item label="模版内容">
        {{ formData?.templateContent }}
      </Descriptions.Item>
      <Descriptions.Item label="模版参数">
        {{ formData?.templateParams }}
      </Descriptions.Item>
      <Descriptions.Item label="模版类型">
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
      <Descriptions.Item label="创建时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
