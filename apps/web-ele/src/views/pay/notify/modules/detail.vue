<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElDivider,
  ElTable,
  ElTag,
} from 'element-plus';

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
    <ElDescriptions border :column="2" class="mx-4">
      <ElDescriptionsItem label="商户订单编号">
        <ElTag>{{ formData?.merchantOrderId }}</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="通知状态">
        <DictTag
          :type="DICT_TYPE.PAY_NOTIFY_STATUS"
          :value="formData?.status"
        />
      </ElDescriptionsItem>

      <ElDescriptionsItem label="应用编号">
        {{ formData?.appId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="应用名称">
        {{ formData?.appName }}
      </ElDescriptionsItem>

      <ElDescriptionsItem label="关联编号">
        {{ formData?.dataId }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="通知类型">
        <DictTag :type="DICT_TYPE.PAY_NOTIFY_TYPE" :value="formData?.type" />
      </ElDescriptionsItem>

      <ElDescriptionsItem label="通知次数">
        {{ formData?.notifyTimes }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="最大通知次数">
        {{ formData?.maxNotifyTimes }}
      </ElDescriptionsItem>

      <ElDescriptionsItem label="最后通知时间">
        {{ formatDateTime(formData?.lastExecuteTime || '') }}
      </ElDescriptionsItem>

      <ElDescriptionsItem label="创建时间">
        {{ formatDateTime(formData?.createTime || '') }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="更新时间">
        {{ formatDateTime(formData?.updateTime || '') }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElDivider />

    <ElDescriptions border :column="1" class="mx-4">
      <ElDescriptionsItem label="回调日志">
        <ElTable
          v-if="formData"
          :data-source="formData.logs"
          :columns="detailColumns"
        />
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
