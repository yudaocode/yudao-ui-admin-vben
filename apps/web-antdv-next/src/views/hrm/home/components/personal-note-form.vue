<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { HrmEmployeePersonalNoteApi } from '#/api/hrm/employee/personal-note';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenForm, z } from '#/adapter/form';
import { createEmployeePersonalNote } from '#/api/hrm/employee/personal-note';

const emit = defineEmits<{
  success: [];
}>();

/** 个人备忘表单 */
function usePersonalNoteFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'DatePicker',
      componentProps: {
        class: 'w-full',
        allowClear: true,
        format: 'YYYY-MM-DD HH:mm:ss',
        placeholder: '请选择提醒时间',
        showTime: true,
        valueFormat: 'x',
      },
      fieldName: 'reminderTime',
      label: '提醒时间',
      rules: 'required',
    },
    {
      component: 'TextArea',
      componentProps: {
        maxlength: 1024,
        placeholder: '请输入备忘内容',
        rows: 4,
        showCount: true,
      },
      fieldName: 'content',
      label: '备忘内容',
      rules: z.string().min(1, { message: '备忘内容不能为空' }),
    },
  ];
}

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-2',
    labelWidth: 84,
  },
  layout: 'horizontal',
  schema: usePersonalNoteFormSchema(),
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
    const values =
      (await formApi.getValues()) as HrmEmployeePersonalNoteApi.EmployeePersonalNote;
    try {
      await createEmployeePersonalNote({
        content: values.content,
        reminderTime: Number(values.reminderTime),
      });
      // 关闭并提示
      await modalApi.close();
      emit('success');
      message.success('新增备忘成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    // 加载数据
    const data = modalApi.getData<{ date?: string }>();
    const date = data?.date || dayjs().format('YYYY-MM-DD');
    await formApi.resetForm();
    // 设置到 values
    await formApi.setValues({
      content: '',
      reminderTime: dayjs(`${date} ${dayjs().format('HH:mm')}:00`).valueOf(),
    });
  },
});
</script>

<template>
  <Modal title="新增备忘" class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
