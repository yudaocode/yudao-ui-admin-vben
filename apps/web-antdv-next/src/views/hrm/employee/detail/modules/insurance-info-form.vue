<script lang="ts" setup>
import type { HrmInsuranceEmployeeInfoApi } from '#/api/hrm/insurance/employee-info';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { saveInsuranceEmployeeInfo } from '#/api/hrm/insurance/employee-info';
import { $t } from '#/locales';

import { useInsuranceInfoFormSchema } from '../../data';
const emit = defineEmits(['success']);
const employeeId = ref<number>();
const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 140, componentProps: { class: 'w-full' } },
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
      message.success($t('ui.actionMessage.operationSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
});
function open(
  empId: number,
  row?: HrmInsuranceEmployeeInfoApi.InsuranceEmployeeInfo,
) {
  employeeId.value = empId;
  formApi.resetForm();
  formApi.setValues({ ...row, employeeId: empId });
  modalApi.setState({ title: '编辑社保资料' });
  modalApi.open();
}
defineExpose({ open });
</script>
<template>
  <Modal class="w-[720px]"><Form class="mx-4" /></Modal>
</template>
