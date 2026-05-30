<script lang="ts" setup>
import type { MesCalHolidayApi } from '#/api/mes/cal/holiday';

import { useVbenModal } from '@vben/common-ui';
import { HolidayType } from '@vben/constants';

import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { getHolidayByDay, saveHoliday } from '#/api/mes/cal/holiday';

import { useHolidayFormSchema } from '../data';

const emit = defineEmits(['success']);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 80,
  },
  layout: 'horizontal',
  schema: useHolidayFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    // 提交表单
    const data = (await formApi.getValues()) as MesCalHolidayApi.Holiday & { dayDisplay?: string };
    try {
      await saveHoliday({ day: data.day, type: data.type, remark: data.remark });
      // 关闭并提示
      await modalApi.close();
      emit('success');
      ElMessage.success('设置成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const data = modalApi.getData<{ day: string }>();
    if (!data?.day) {
      return;
    }
    const timestamp = dayjs(data.day + ' 00:00:00').valueOf();
    await formApi.setValues({
      day: timestamp,
      dayDisplay: data.day,
      type: HolidayType.WORKDAY,
      remark: '',
    });
    modalApi.lock();
    try {
      const holiday = await getHolidayByDay(dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'));
      if (holiday) {
        await formApi.setValues({
          type: holiday.type ?? HolidayType.WORKDAY,
          remark: holiday.remark ?? '',
        });
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal title="假期设置" class="w-1/3">
    <Form class="mx-4" />
  </Modal>
</template>
