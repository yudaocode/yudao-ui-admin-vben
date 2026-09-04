<script lang="ts" setup>
import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { updateEmployee } from '#/api/hrm/portal/employee';

import { useEmployeeFormSchema } from '../data';

defineOptions({ name: 'HrmPortalEmployeeForm' });

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 104,
  },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    try {
      await updateEmployee(await formApi.getValues());
      await modalApi.close();
      emit('success');
      ElMessage.success('保存成功');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    const { employee, fields } = modalApi.getData() as any;
    const editableFields = new Set<string>(
      fields
        .filter((field: any) => field.editable)
        .map((field: any) => field.name),
    );
    await formApi.setState({ schema: useEmployeeFormSchema(editableFields) });
    await formApi.resetForm();
    await formApi.setValues(
      Object.fromEntries(
        Object.entries(employee).filter(([name]) => editableFields.has(name)),
      ),
    );
  },
  title: '编辑我的档案',
});
</script>

<template>
  <Modal class="w-[760px]">
    <Form class="mx-4" />
  </Modal>
</template>
