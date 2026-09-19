<script lang="ts" setup>
import type { OaTaskApi } from '#/api/oa/task';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import { createTask, getTask, updateTask } from '#/api/oa/task';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaTaskApi.Task>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['任务'])
    : $t('ui.actionTitle.create', ['任务']);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  wrapperClass: 'grid-cols-2',
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
    // 校验任务时间
    const data = (await formApi.getValues()) as OaTaskApi.Task;
    if (Number(data.endTime) <= Number(data.startTime)) {
      message.error('结束时间必须晚于开始时间');
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      await (formData.value?.id ? updateTask(data) : createTask(data));
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
      return;
    }
    // 新增时，初始化任务周期为当前时间起的一天
    const data = modalApi.getData() as OaTaskApi.Task;
    if (!data || !data.id) {
      const startTime = dayjs().second(0).millisecond(0);
      await formApi.setValues({
        startTime: startTime.valueOf(),
        endTime: startTime.add(1, 'day').valueOf(),
      });
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getTask(data.id);
      // 设置到 values
      await formApi.setValues({
        ...formData.value,
        receiverUserIds:
          formData.value.receivers?.map((receiver) => receiver.userId) || [],
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-2/3">
    <Form class="mx-4" />
  </Modal>
</template>
