<script lang="ts" setup>
import type { PmsWorkItemStatusApi } from '#/api/pms/pm/workitem/status';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  deleteWorkItemStatus,
  getWorkItemStatus,
  getWorkItemStatusList,
} from '#/api/pms/pm/workitem/status';

defineOptions({ name: 'PmsWorkItemStatusDeleteForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const statusName = ref(''); // 待删除状态名称
const statusList = ref<PmsWorkItemStatusApi.WorkItemStatus[]>([]); // 可迁移目标状态列表

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [
    {
      component: 'Select',
      componentProps: () => ({
        options: statusList.value.map((status) => ({
          label: status.name,
          value: status.id,
        })),
        placeholder: '请选择目标状态',
      }),
      fieldName: 'transferStatusId',
      label: '迁移到',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = modalApi.getData() as { id: number };
    const values = await formApi.getValues();
    modalApi.lock();
    try {
      await deleteWorkItemStatus(data.id, values.transferStatusId);
      message.success('状态已删除，工作项迁移完成');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      statusName.value = '';
      statusList.value = [];
      return;
    }
    const data = modalApi.getData() as { id: number };
    modalApi.lock();
    try {
      const status = await getWorkItemStatus(data.id);
      statusList.value = (
        await getWorkItemStatusList(status.projectId, status.workItemType)
      ).filter((item) => item.id !== data.id);
      statusName.value = status.name;
      // 默认选中第一个可迁移状态
      await formApi.setValues({ transferStatusId: statusList.value[0]?.id });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="迁移并删除状态" class="w-[480px]">
    <div class="mx-4 mb-4 flex">
      <span class="w-[100px] shrink-0 text-right">待删除状态：</span>
      <span>{{ statusName }}</span>
    </div>
    <Form class="mx-4" />
  </Modal>
</template>
