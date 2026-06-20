<script lang="ts" setup>
import type { ImManagerGroupApi } from '#/api/im/manager/group';

import { reactive } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message } from 'antdv-next';

import { banManagerGroup } from '#/api/im/manager/group';

const emit = defineEmits(['success']);

const formData = reactive({
  id: 0,
  groupName: '',
  reason: '',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    if (!formData.reason.trim()) {
      message.warning('请输入封禁原因');
      return;
    }
    modalApi.lock();
    try {
      await banManagerGroup({ id: formData.id, reason: formData.reason });
      await modalApi.close();
      emit('success');
      message.success('封禁成功');
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<ImManagerGroupApi.Group>();
    formData.id = data.id;
    formData.groupName = data.name;
    formData.reason = '';
  },
});
</script>

<template>
  <Modal class="w-1/3" title="封禁群">
    <Form :label-col="{ style: { width: '80px' } }">
      <FormItem label="群名称">
        {{ formData.groupName }}
      </FormItem>
      <FormItem label="封禁原因" required>
        <Input.TextArea
          v-model:value="formData.reason"
          :maxlength="200"
          :rows="3"
          placeholder="请输入封禁原因"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
