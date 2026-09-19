<script lang="ts" setup>
import type { OaScheduleApi } from '#/api/oa/schedule';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import {
  createSchedule,
  getSchedule,
  updateSchedule,
} from '#/api/oa/schedule';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'OaScheduleForm' });

const emit = defineEmits(['success']);
const formData = ref<OaScheduleApi.Schedule>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['日程'])
    : $t('ui.actionTitle.create', ['日程']);
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
    // 校验日程时间
    const data = (await formApi.getValues()) as OaScheduleApi.Schedule;
    if (Number(data.endTime) <= Number(data.startTime)) {
      message.error('结束时间必须晚于开始时间');
      return;
    }
    modalApi.lock();
    // 提交表单
    try {
      await (formData.value?.id
        ? updateSchedule(data)
        : createSchedule(data));
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
    // 加载数据
    const data = modalApi.getData() as OaScheduleApi.Schedule;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getSchedule(data.id);
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-1/2">
    <Form class="mx-4" />
  </Modal>
</template>
