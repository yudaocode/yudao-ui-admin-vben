<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, message, Radio, RadioGroup } from 'antdv-next';

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
      message.warning('请选择频道和素材');
      return;
    }
    if (
      formData.value.receiverUserType === 'users' &&
      formData.value.receiverUserIds.length === 0
    ) {
      message.warning('请至少选择一个接收用户');
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
      message.success('推送成功');
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
  <Modal class="w-2/5" title="立即推送频道消息">
    <Form :label-col="{ style: { width: '110px' } }">
      <FormItem label="所属频道" required>
        <ChannelSelect
          v-model="formData.channelId"
          placeholder="请选择频道（用于加载素材）"
        />
      </FormItem>
      <FormItem label="素材" required>
        <MaterialSelect
          v-model="formData.materialId"
          :channel-id="formData.channelId"
          placeholder="请选择素材"
        />
      </FormItem>
      <FormItem label="受众">
        <RadioGroup v-model:value="formData.receiverUserType">
          <Radio value="all">全员</Radio>
          <Radio value="users">指定用户</Radio>
        </RadioGroup>
      </FormItem>
      <FormItem
        v-if="formData.receiverUserType === 'users'"
        label="接收用户"
        required
      >
        <UserSelect
          v-model="formData.receiverUserIds"
          multiple
          placeholder="请选择接收用户"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
