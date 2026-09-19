<script lang="ts" setup>
import type { OaAttendanceApi } from '#/api/oa/attendance';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { getAttendance, updateAttendance } from '#/api/oa/attendance';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'OaAttendanceForm' });

const emit = defineEmits(['success']);
const formData = ref<OaAttendanceApi.Attendance>();

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
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !formData.value) {
      return;
    }
    modalApi.lock();
    try {
      // 只允许修改考勤状态和备注，其他字段保持原值
      const values = await formApi.getValues();
      await updateAttendance({
        ...formData.value,
        status: values.status,
        remark: values.remark,
      });
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      formData.value = undefined;
      return;
    }
    modalApi.setState({ title: $t('ui.actionTitle.edit', ['考勤记录']) });
    await formApi.reset();
    const { id } = modalApi.getData() as { id?: number };
    if (!id) {
      return;
    }
    // 加载数据
    modalApi.lock();
    try {
      formData.value = await getAttendance(id);
      // 考勤类型展示为字典文案，隐藏的 type 字段用于联动可选的考勤状态
      await formApi.setValues({
        ...formData.value,
        typeName: getDictLabel(
          DICT_TYPE.OA_ATTENDANCE_TYPE,
          formData.value.type,
        ),
      });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
