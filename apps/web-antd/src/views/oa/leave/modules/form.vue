<script lang="ts" setup>
import type { OaLeaveApi } from '#/api/oa/leave';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { useVbenForm } from '#/adapter/form';
import {
  createLeaveApply,
  getLeaveApply,
  updateLeaveApply,
} from '#/api/oa/leave';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<OaLeaveApi.LeaveApply>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', ['请假申请'])
    : $t('ui.actionTitle.create', ['请假申请']);
});

const rangeTimes = ref<{ endTime?: string; startTime?: string }>({}); // 起止时间，用于计算天数
/** 按申请起止时间计算天数 */
const days = computed(() => {
  if (!rangeTimes.value.startTime || !rangeTimes.value.endTime) {
    return undefined;
  }
  const value = dayjs(Number(rangeTimes.value.endTime)).diff(
    dayjs(Number(rangeTimes.value.startTime)),
    'day',
    true,
  );
  return Math.ceil(value);
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
  handleValuesChange(values) {
    rangeTimes.value = {
      startTime: values.startTime,
      endTime: values.endTime,
    };
  },
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as OaLeaveApi.LeaveApply;
    try {
      await (formData.value?.id
        ? updateLeaveApply(data)
        : createLeaveApply(data));
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
      rangeTimes.value = {};
      return;
    }
    // 加载数据
    const data = modalApi.getData() as OaLeaveApi.LeaveApply;
    if (!data || !data.id) {
      return;
    }
    modalApi.lock();
    try {
      formData.value = await getLeaveApply(data.id);
      rangeTimes.value = {
        startTime: formData.value.startTime,
        endTime: formData.value.endTime,
      };
      // 设置到 values
      await formApi.setValues(formData.value);
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[800px]">
    <Form class="mx-4">
      <template #days>
        <Input :value="days" addon-after="天" disabled class="w-full" />
      </template>
    </Form>
  </Modal>
</template>
