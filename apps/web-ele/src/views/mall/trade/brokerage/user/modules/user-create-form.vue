<script lang="ts" setup>
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';
import { formatDate, isEmpty } from '@vben/utils';

import {
  ElAvatar,
  ElDescriptions,
  ElDescriptionsItem,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

import {
  createBrokerageUser,
  getBrokerageUser,
} from '#/api/mall/trade/brokerage/user';
import { getUser } from '#/api/member/user';

defineOptions({ name: 'BrokerageUserCreateForm' });

const emit = defineEmits(['success']);

const formData = ref<any>({
  userId: undefined,
  bindUserId: undefined,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value) {
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      await createBrokerageUser(formData.value);
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
      return;
    }
    formData.value = {
      userId: undefined,
      bindUserId: undefined,
    };
  },
});

/** 用户信息 */
const userInfo = reactive<{
  bindUser: MallBrokerageUserApi.BrokerageUser | undefined;
  user: MallBrokerageUserApi.BrokerageUser | undefined;
}>({
  bindUser: undefined,
  user: undefined,
});

/** 查询推广员和分销员 */
async function handleGetUser(id: any, userType: string) {
  if (isEmpty(id)) {
    ElMessage.warning(`请先输入${userType}编号后重试！！！`);
    return;
  }
  if (
    userType === '推广员' &&
    formData.value?.bindUserId === formData.value?.userId
  ) {
    ElMessage.error('不能绑定自己为推广人');
    return;
  }

  try {
    const user =
      userType === '推广员' ? await getBrokerageUser(id) : await getUser(id);
    if (userType === '推广员') {
      userInfo.bindUser = user as MallBrokerageUserApi.BrokerageUser;
    } else {
      userInfo.user = user as MallBrokerageUserApi.BrokerageUser;
    }

    if (!user) {
      ElMessage.warning(`${userType}不存在`);
    }
  } catch {
    ElMessage.warning(`${userType}不存在`);
  }
}
</script>

<template>
  <Modal title="创建分销员" class="w-2/5">
    <div class="mr-2 flex items-center">
      分销员编号：
      <ElInput
        v-model="formData.userId"
        placeholder="请输入推广员编号"
        class="mx-2 !w-52"
      >
        <template #append>
          <ElButton
            type="primary"
            @click="handleGetUser(formData?.userId, '分销员')"
          >
            <IconifyIcon icon="lucide:search" :size="15" />
          </ElButton>
        </template>
      </ElInput>
      上级推广人编号：
      <ElInput
        v-model="formData.bindUserId"
        placeholder="请输入推广员编号"
        class="mx-2 !w-52"
      >
        <template #append>
          <ElButton
            type="primary"
            @click="handleGetUser(formData?.bindUserId, '推广员')"
          >
            <IconifyIcon icon="lucide:search" :size="15" />
          </ElButton>
        </template>
      </ElInput>
    </div>

    <div class="mt-4">
      <!-- 展示分销员的信息 -->
      <ElDescriptions
        title="分销员信息"
        class="mt-4"
        v-if="userInfo.user"
        :column="1"
        bordered
      >
        <ElDescriptionsItem label="头像">
          <ElAvatar :src="userInfo.user?.avatar" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="昵称">
          {{ userInfo.user?.nickname }}
        </ElDescriptionsItem>
      </ElDescriptions>
      <!-- 展示上级推广人的信息 -->
      <ElDescriptions
        title="上级推广人信息"
        class="mt-4"
        v-if="userInfo.bindUser"
        :column="1"
        bordered
      >
        <ElDescriptionsItem label="头像">
          <ElAvatar :src="userInfo.bindUser?.avatar" />
        </ElDescriptionsItem>
        <ElDescriptionsItem label="昵称">
          {{ userInfo.bindUser?.nickname }}
        </ElDescriptionsItem>
        <ElDescriptionsItem label="推广资格">
          <ElTag v-if="userInfo.bindUser?.brokerageEnabled" color="success">
            有
          </ElTag>
          <ElTag v-else>无</ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem label="成为推广员的时间">
          {{ formatDate(userInfo.bindUser?.brokerageTime) }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </div>
  </Modal>
</template>
