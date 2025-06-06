<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, Divider, Table, Tag } from 'ant-design-vue';

import { getNotifyTaskDetail } from '#/api/pay/notify';
import { DictTag } from '#/components/dict-tag';
import { DICT_TYPE } from '#/utils';

import { detailColumns } from '../data';

const formData = ref();

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    // 加载数据
    const data = modalApi.getData();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getNotifyTaskDetail(data.id);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal
    title="通知详情"
    class="w-1/2"
    :show-cancel-button="false"
    :show-confirm-button="false"
  >
    <Descriptions bordered :column="2" size="middle" class="mx-4">
      <Descriptions.Item label="商户订单编号">
        <Tag>{{ formData?.merchantOrderId }}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="通知状态">
        <DictTag
          :type="DICT_TYPE.PAY_NOTIFY_STATUS"
          :value="formData?.status"
        />
      </Descriptions.Item>

      <Descriptions.Item label="应用编号">
        {{ formData?.appId }}
      </Descriptions.Item>
      <Descriptions.Item label="应用名称">
        {{ formData?.appName }}
      </Descriptions.Item>

      <Descriptions.Item label="关联编号">
        {{ formData?.dataId }}
      </Descriptions.Item>
      <Descriptions.Item label="通知类型">
        <DictTag :type="DICT_TYPE.PAY_NOTIFY_TYPE" :value="formData?.type" />
      </Descriptions.Item>

      <Descriptions.Item label="通知次数">
        {{ formData?.notifyTimes }}
      </Descriptions.Item>
      <Descriptions.Item label="最大通知次数">
        {{ formData?.maxNotifyTimes }}
      </Descriptions.Item>

      <Descriptions.Item label="最后通知时间">
        {{ formatDateTime(formData?.lastExecuteTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="下次通知时间">
        {{ formatDateTime(formData?.nextNotifyTime || '') }}
      </Descriptions.Item>

      <Descriptions.Item label="创建时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </Descriptions.Item>
      <Descriptions.Item label="更新时间">
        {{ formatDateTime(formData?.updateTime || '') }}
      </Descriptions.Item>
    </Descriptions>

    <Divider />

    <Descriptions bordered :column="1" size="middle" class="mx-4">
      <Descriptions.Item label="回调日志">
        <Table
          v-if="formData"
          :data-source="formData.logs"
          :columns="detailColumns"
        />
      </Descriptions.Item>
    </Descriptions>
  </Modal>
</template>
