<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  createInsuranceMonthEmployeeRecordList,
  getUninsuredEmployeeList,
} from '#/api/hrm/insurance/month-record/employee';

defineOptions({ name: 'HrmInsuranceAddEmployeeForm' });

const emit = defineEmits(['success']);

const monthRecordId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 76,
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'employeeIds',
      label: '员工',
      component: 'ApiSelect',
      rules: 'required',
      componentProps: {
        mode: 'multiple',
        labelField: 'name',
        valueField: 'id',
        placeholder: '请选择员工',
        optionFilterProp: 'label',
        showSearch: true,
        api: async () => [],
      },
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !monthRecordId.value) {
      return;
    }
    modalApi.lock();
    try {
      const { employeeIds } = await formApi.getValues();
      await createInsuranceMonthEmployeeRecordList({
        monthRecordId: monthRecordId.value,
        employeeIds: employeeIds as number[],
      });
      message.success('添加成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const recordId = modalApi.getData<{ recordId?: number }>()?.recordId;
    if (!recordId) {
      return;
    }
    monthRecordId.value = recordId;
    modalApi.lock();
    try {
      const employeeList = await getUninsuredEmployeeList(recordId);
      formApi.updateSchema([
        {
          fieldName: 'employeeIds',
          componentProps: {
            mode: 'multiple',
            labelField: 'name',
            valueField: 'id',
            placeholder: '请选择员工',
            optionFilterProp: 'label',
            showSearch: true,
            options: employeeList.map((employee) => ({
              label: employee.name,
              value: employee.id,
            })),
          },
        },
      ]);
      await formApi.resetForm();
      modalApi.setState({ title: '添加参保人员' });
    } finally {
      modalApi.unlock();
    }
  },
});

defineExpose({
  open: (recordId: number) => {
    modalApi.setData({ recordId }).open();
  },
});
</script>

<template>
  <Modal class="w-[560px]">
    <Form class="mx-4" />
  </Modal>
</template>
