<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { updateEmployeeScheme } from '#/api/hrm/insurance/employee-info';
import { executeBatch } from '#/views/hrm/utils/batch';

import { useInsuranceSchemeFormSchema } from '../data';

defineOptions({ name: 'HrmEmployeeInsuranceSchemeForm' });

const emit = defineEmits(['success']);
const employeeIds = ref<number[]>([]);

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 92, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useInsuranceSchemeFormSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const { schemeId } = await formApi.getValues();
      const success = await executeBatch(
        employeeIds.value.map((employeeId) =>
          updateEmployeeScheme(employeeId, schemeId as number),
        ),
      );
      if (!success) return;
      message.success('参保方案设置成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const ids = modalApi.getData<number[]>() || [];
    employeeIds.value = ids;
    await formApi.resetForm();
    await formApi.setValues({ employeeCount: `${ids.length} 人` });
    modalApi.setState({ title: '设置参保方案' });
  },
});
</script>

<template>
  <Modal class="w-[520px]">
    <Form class="mx-4" />
  </Modal>
</template>
