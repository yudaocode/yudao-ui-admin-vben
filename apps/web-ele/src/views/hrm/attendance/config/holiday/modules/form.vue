<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import {
  createAttendanceHoliday,
  getAttendanceHoliday,
  updateAttendanceHoliday,
} from '#/api/hrm/attendance/holiday';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'HrmAttendanceHolidayForm' });

const emit = defineEmits(['success']);
const formType = ref<'create' | 'update'>('create');

const [Form, formApi] = useVbenForm({
  commonConfig: { componentProps: { class: 'w-full' }, labelWidth: 88 },
  layout: 'horizontal',
  schema: useFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await (formType.value === 'create'
        ? createAttendanceHoliday(values as any)
        : updateAttendanceHoliday(values as any));
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { id, type = 'create' } = modalApi.getData() as {
      id?: number;
      type?: 'create' | 'update';
    };
    formType.value = type;
    modalApi.setState({
      title: type === 'create' ? '新增节假日' : '编辑节假日',
    });
    await formApi.reset();
    if (id) await formApi.setValues(await getAttendanceHoliday(id));
  },
});
</script>

<template>
  <Modal class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
