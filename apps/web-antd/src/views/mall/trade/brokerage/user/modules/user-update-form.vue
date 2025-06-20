<script lang="ts" setup>
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { formatDate } from '@vben/utils';

import {
  Avatar,
  Descriptions,
  DescriptionsItem,
  InputSearch,
  message,
  Tag,
} from 'ant-design-vue';

import {
  getBrokerageUser,
  updateBindUser,
} from '#/api/mall/trade/brokerage/user';

/** 修改分销用户 */
defineOptions({ name: 'BrokerageUserUpdateForm' });

const emit = defineEmits(['success']);

const formData = ref<any>();

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value) {
      return;
    }
    // 未查找到合适的上级
    if (!bindUser.value) {
      message.error('请先查询并确认推广人');
      return;
    }
    modalApi.lock();
    try {
      await updateBindUser(formData.value);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange: async (isOpen: boolean) => {
    if (!isOpen) {
      formData.value = {
        id: 0,
        bindUserId: 0,
      };
      return;
    }
    const data = modalApi.getData<MallBrokerageUserApi.BrokerageUser>();
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = {
        id: data.id,
        bindUserId: data.bindUserId,
      };
      if (data.bindUserId) {
        await handleGetUser();
      }
    } finally {
      modalApi.unlock();
    }
  },
});

const bindUser = ref<MallBrokerageUserApi.BrokerageUser>();

/** 查询推广员 */
async function handleGetUser() {
  if (!formData.value) {
    return;
  }
  if (formData.value.bindUserId === formData.value.id) {
    message.error('不能绑定自己为推广人');
    return;
  }
  try {
    bindUser.value = await getBrokerageUser(formData.value.bindUserId);
    if (!bindUser.value) {
      message.warning('推广员不存在');
    }
  } catch {
    message.warning('推广员不存在');
  }
}
</script>

<template>
  <Modal title="修改上级推广人" class="w-2/5">
    <div class="mr-2 flex items-center">
      推广员编号：
      <InputSearch
        v-model:value="formData.bindUserId"
        placeholder="请输入推广员编号"
        enter-button
        class="mx-2 w-52"
        @search="handleGetUser"
      />
    </div>

    <!-- 展示上级推广人的信息 -->
    <Descriptions class="mt-4" v-if="bindUser" :column="1" bordered>
      <DescriptionsItem label="头像">
        <Avatar :src="bindUser.avatar" />
      </DescriptionsItem>
      <DescriptionsItem label="昵称">
        {{ bindUser.nickname }}
      </DescriptionsItem>
      <DescriptionsItem label="推广资格">
        <Tag v-if="bindUser.brokerageEnabled" color="success">有</Tag>
        <Tag v-else>无</Tag>
      </DescriptionsItem>
      <DescriptionsItem label="成为推广员的时间">
        {{ formatDate(bindUser.brokerageTime) }}
      </DescriptionsItem>
    </Descriptions>
  </Modal>
</template>
