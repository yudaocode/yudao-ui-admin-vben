<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElForm, ElFormItem, ElMessage, ElRadio, ElRadioGroup } from 'element-plus'

import { sendManagerChannelMessage } from '#/api/im/manager/channel/message';
import { ChannelSelect } from '#/views/im/manager/channel/list/components';
import { MaterialSelect } from '#/views/im/manager/channel/material/components';
import { UserSelect } from '#/views/system/user/components';

const emit = defineEmits(['success']);

const formData = ref({
  channelId: undefined as number | undefined,
  materialId: undefined as number | undefined,
  receiverUserType: 'all' as 'all' | 'users',
  receiverUserIds: [] as number[],
});

/** 重置表单 */
function resetForm() {
  formData.value = {
    channelId: undefined,
    materialId: undefined,
    receiverUserType: 'all',
    receiverUserIds: [],
  };
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.value.channelId || !formData.value.materialId) {
      ElMessage.warning('请选择频道和素材');
      return;
    }
    if (
      formData.value.receiverUserType === 'users' &&
      formData.value.receiverUserIds.length === 0
    ) {
      ElMessage.warning('请至少选择一个接收用户');
      return;
    }
    modalApi.lock();
    try {
      await sendManagerChannelMessage({
        materialId: formData.value.materialId,
        receiverUserIds:
          formData.value.receiverUserType === 'users'
            ? formData.value.receiverUserIds
            : undefined,
      });
      await modalApi.close();
      emit('success');
      ElMessage.success('推送成功');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      resetForm();
    }
  },
});
</script>

<template>
  <Modal title="立即推送频道消息" class="w-2/5">
    <ElForm label-width="110px">
      <ElFormItem label="所属频道" required>
        <ChannelSelect
          v-model="formData.channelId"
          placeholder="请选择频道（用于加载素材）"
        />
      </ElFormItem>
      <ElFormItem label="素材" required>
        <MaterialSelect
          v-model="formData.materialId"
          :channel-id="formData.channelId"
          placeholder="请选择素材"
        />
      </ElFormItem>
      <ElFormItem label="受众">
        <ElRadioGroup v-model="formData.receiverUserType">
          <ElRadio value="all">全员</ElRadio>
          <ElRadio value="users">指定用户</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem v-if="formData.receiverUserType === 'users'" label="接收用户" required>
        <UserSelect
          v-model="formData.receiverUserIds"
          multiple
          placeholder="请选择接收用户"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
