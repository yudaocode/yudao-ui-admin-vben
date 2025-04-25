<script lang="ts" setup>
import type { SystemNotifyMessageApi } from '#/api/system/notify/message';

import { h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { useDescription } from '#/components/description';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils/dict';

const formData = ref<SystemNotifyMessageApi.NotifyMessage>();

const [Description, descApi] = useDescription({
  componentProps: {
    bordered: true,
    column: 1,
    size: 'middle',
    class: 'mx-4',
  },
  schema: [
    {
      field: 'templateNickname',
      label: '发送人',
    },
    {
      field: 'createTime',
      label: '发送时间',
      content: (data) => formatDateTime(data?.createTime) as string,
    },
    {
      field: 'templateType',
      label: '消息类型',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.SYSTEM_NOTIFY_TEMPLATE_TYPE,
          value: data?.templateType,
        }),
    },
    {
      field: 'readStatus',
      label: '是否已读',
      content: (data) =>
        h(DictTag, {
          type: DICT_TYPE.INFRA_BOOLEAN_STRING,
          value: data?.readStatus,
        }),
    },
    {
      field: 'readTime',
      label: '阅读时间',
      content: (data) => formatDateTime(data?.readTime) as string,
    },
    {
      field: 'templateContent',
      label: '消息内容',
    },
  ],
});

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
      descApi.setState({ data });
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
    <Description />
  </Modal>
</template>
