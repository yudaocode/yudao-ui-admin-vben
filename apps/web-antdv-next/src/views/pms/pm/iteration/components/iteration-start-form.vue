<script lang="ts" setup>
import type { PmsIterationApi } from '#/api/pms/pm/iteration';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
// TODO @AI：useVbenForm 从 #/adapter/form 引入，对齐 system user；PMS 里好些 form 都从 @vben/common-ui 拿，三端一并改。

import { useVbenForm } from '#/adapter/form';
import { startIteration } from '#/api/pms/pm/iteration';

import { useFormSchema } from './data';

defineOptions({ name: 'PmsIterationStartForm' });

const emit = defineEmits(['success']); // 定义 success 事件，用于操作成功后的回调

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 92,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    const data = modalApi.getData() as PmsIterationApi.Iteration;
    const values = await formApi.getValues();
    modalApi.lock();
    try {
      await startIteration({
        id: data.id!,
        startTime: Number(values.timeRange[0]),
        endTime: Number(values.timeRange[1]),
      });
      message.success('迭代已开始');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData() as PmsIterationApi.Iteration;
    await formApi.setValues({
      timeRange:
        data.startTime && data.endTime
          ? [String(data.startTime), String(data.endTime)]
          : [],
    });
  },
});
</script>

<template>
  <Modal title="开始迭代" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
