<script lang="ts" setup>
import type { HrmInsuranceEmployeeInfoApi } from '#/api/hrm/insurance/employee-info';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { saveInsuranceEmployeeInfo } from '#/api/hrm/insurance/employee-info';
import { $t } from '#/locales';

import { useInsuranceInfoFormSchema } from '../../data';

const emit = defineEmits(['success']);
const employeeId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 140,
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: useInsuranceInfoFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      await saveInsuranceEmployeeInfo({
        ...(await formApi.getValues()),
        employeeId: employeeId.value,
      });
      ElMessage.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const { employeeId: currentEmployeeId, row } = modalApi.getData() as {
      employeeId: number;
      row?: HrmInsuranceEmployeeInfoApi.InsuranceEmployeeInfo;
    };
    employeeId.value = currentEmployeeId;
    await formApi.reset();
    await formApi.setValues({ ...row, employeeId: currentEmployeeId });
  },
});
</script>

<template>
  <Modal title="编辑社保资料" class="w-[720px]">
    <Form class="mx-4" />
  </Modal>
</template>
