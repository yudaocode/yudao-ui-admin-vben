<script lang="ts" setup>
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { formatDate } from '@vben/utils';

import {
  ElAvatar,
  ElDescriptions,
  ElDescriptionsItem,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

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
      ElMessage.error('请先查询并确认推广人');
      return;
    }
    modalApi.lock();
    try {
      await updateBindUser(formData.value);
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
    ElMessage.error('不能绑定自己为推广人');
    return;
  }
  try {
    bindUser.value = await getBrokerageUser(formData.value.bindUserId);
    if (!bindUser.value) {
      ElMessage.warning('推广员不存在');
    }
  } catch {
    ElMessage.warning('推广员不存在');
  }
}
</script>

<template>
  <Modal title="修改上级推广人" class="w-2/5">
    <div class="mr-2 flex items-center">
      推广员编号：
      <ElInput
        v-model="formData.bindUserId"
        placeholder="请输入推广员编号"
        class="mx-2 !w-52"
      >
        <template #append>
          <ElButton type="primary" @click="handleGetUser">
            <IconifyIcon icon="lucide:search" :size="15" />
          </ElButton>
        </template>
      </ElInput>
    </div>

    <!-- 展示上级推广人的信息 -->
    <ElDescriptions class="mt-4" v-if="bindUser" :column="1" bordered>
      <ElDescriptionsItem label="头像">
        <ElAvatar :src="bindUser.avatar" />
      </ElDescriptionsItem>
      <ElDescriptionsItem label="昵称">
        {{ bindUser.nickname }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="推广资格">
        <ElTag v-if="bindUser.brokerageEnabled" color="success">有</ElTag>
        <ElTag v-else>无</ElTag>
      </ElDescriptionsItem>
      <ElDescriptionsItem label="成为推广员的时间">
        {{ formatDate(bindUser.brokerageTime) }}
      </ElDescriptionsItem>
    </ElDescriptions>
  </Modal>
</template>
