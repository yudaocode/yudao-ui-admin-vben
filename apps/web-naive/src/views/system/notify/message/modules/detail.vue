<script lang="ts" setup>
// TODO @xingyu：这个展示不出来；从右上角的站内信点进来的
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { NDescriptions, NDescriptionsItem } from 'naive-ui';

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
    <NDescriptions bordered :column="1" size="middle" class="mx-4">
      <NDescriptionsItem label="编号">{{ formData?.id }}</NDescriptionsItem>
      <NDescriptionsItem label="用户类型">
        <DictTag :type="DICT_TYPE.USER_TYPE" :value="formData?.userType" />
      </NDescriptionsItem>
      <NDescriptionsItem label="用户编号">
        {{ formData?.userId }}
      </NDescriptionsItem>
      <NDescriptionsItem label="模版编号">
        {{ formData?.templateId }}
      </NDescriptionsItem>
      <NDescriptionsItem label="模板编码">
        {{ formData?.templateCode }}
      </NDescriptionsItem>
      <NDescriptionsItem label="发送人名称">
        {{ formData?.templateNickname }}
      </NDescriptionsItem>
      <NDescriptionsItem label="模版内容">
        {{ formData?.templateContent }}
      </NDescriptionsItem>
      <NDescriptionsItem label="模版参数">
        {{ formData?.templateParams }}
      </NDescriptionsItem>
      <NDescriptionsItem label="模版类型">
        <DictTag
          :type="DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE"
          :value="formData?.templateType"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="是否已读">
        <DictTag
          :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
          :value="formData?.readStatus"
        />
      </NDescriptionsItem>
      <NDescriptionsItem label="阅读时间">
        {{ formatDateTime(formData?.readTime || '') }}
      </NDescriptionsItem>
      <NDescriptionsItem label="创建时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </NDescriptionsItem>
    </NDescriptions>
  </Modal>
</template>
