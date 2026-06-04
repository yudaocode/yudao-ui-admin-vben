<script lang="ts" setup>
import type { MesProTaskApi } from '#/api/mes/pro/task';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createTask, getTask, updateTask } from '#/api/mes/pro/task';
import { $t } from '#/locales';

import { useTaskFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MesProTaskApi.Task>();
const context = ref<{
  colorCode?: string;
  itemId?: number;
  processId?: number;
  routeId?: number;
  workOrderId?: number;
}>({}); // 新增任务时的工单 / 工序上下文

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['生产任务'])
    : $t('ui.actionTitle.create', ['生产任务']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 100,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-3',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesProTaskApi.Task;
    try {
      await (formData.value?.id
        ? updateTask({ ...formData.value, ...data })
        : createTask({ ...context.value, ...data }));
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success($t('ui.actionMessage.operationSuccess'));
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      context.value = {};
      return;
    }
    formApi.setState({ schema: useTaskFormSchema(formApi) });
    // 加载数据
    const data = modalApi.getData<{
      colorCode?: string;
      id?: number;
      itemId?: number;
      processId?: number;
      routeId?: number;
      workOrderId?: number;
    }>();
    if (data?.id) {
      modalApi.lock();
      try {
        formData.value = await getTask(data.id);
        // 设置到 values
        await formApi.setValues(formData.value);
      } finally {
        modalApi.unlock();
      }
      return;
    }
    context.value = {
      colorCode: data.colorCode,
      itemId: data.itemId,
      processId: data.processId,
      routeId: data.routeId,
      workOrderId: data.workOrderId,
    };
    await formApi.setValues({
      colorCode: data.colorCode || '#00AEF3',
      duration: 1,
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-3/5">
    <Form class="mx-4" />
  </Modal>
</template>
