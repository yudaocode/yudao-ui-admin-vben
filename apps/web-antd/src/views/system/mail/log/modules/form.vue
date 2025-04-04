<script lang="ts" setup>
import type { SystemMailLogApi } from '#/api/system/mail/log';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, Tag } from 'ant-design-vue';

import { DICT_TYPE, getDictLabel } from '#/utils/dict';

const formData = ref<SystemMailLogApi.MailLog>();
const getTitle = computed(() => {
  return '邮件日志详情';
});

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
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
      modalApi.lock(false);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <div class="p-4">
      <Descriptions :column="2" bordered>
        <Descriptions.Item label="编号">{{ formData?.id }}</Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {{ formatDateTime(formData?.createTime || '') }}
        </Descriptions.Item>
        <Descriptions.Item label="收件邮箱">
          {{ formData?.toMail }}
        </Descriptions.Item>
        <Descriptions.Item label="发送邮箱">
          {{ formData?.fromMail }}
        </Descriptions.Item>
        <Descriptions.Item label="用户编号">
          {{ formData?.userId }}
        </Descriptions.Item>
        <Descriptions.Item label="用户类型">
          {{ formData?.userType }}
        </Descriptions.Item>
        <Descriptions.Item label="模板编号">
          {{ formData?.templateId }}
        </Descriptions.Item>
        <Descriptions.Item label="模板编码">
          {{ formData?.templateCode }}
        </Descriptions.Item>
        <Descriptions.Item label="邮件标题" :span="2">
          {{ formData?.templateTitle }}
        </Descriptions.Item>
        <Descriptions.Item label="邮件内容" :span="2">
          <div v-html="formData?.templateContent"></div>
        </Descriptions.Item>
        <Descriptions.Item label="发送状态">
          <!-- TODO @芋艿: 数据字典-->
          <Tag color="processing">
            {{
              getDictLabel(
                DICT_TYPE.SYSTEM_MAIL_SEND_STATUS,
                formData?.sendStatus,
              )
            }}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="发送时间">
          {{ formatDateTime(formData?.sendTime || '') }}
        </Descriptions.Item>
        <Descriptions.Item label="发送消息编号">
          {{ formData?.sendMessageId }}
        </Descriptions.Item>
        <Descriptions.Item label="发送异常">
          {{ formData?.sendException }}
        </Descriptions.Item>
      </Descriptions>
    </div>
  </Modal>
</template>
