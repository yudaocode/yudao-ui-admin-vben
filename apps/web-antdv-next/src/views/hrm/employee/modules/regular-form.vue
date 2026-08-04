<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';
import dayjs from 'dayjs';

import { regularEmployee } from '#/api/hrm/employee';
import { HrmEmployeeChangeReason } from '#/views/hrm/utils/constants';

import EmployeeSelect from '../components/employee-select.vue';
import { useRegularFormSchema } from '../data';

defineOptions({ name: 'HrmEmployeeRegularForm' });

const emit = defineEmits(['success']);
const disabledLeaderIds = ref<number[]>([]);
const leaderEmployeeId = ref<number>();

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: useRegularFormSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      const values = await formApi.getValues();
      await regularEmployee({
        ...values,
        newLeaderEmployeeId: leaderEmployeeId.value,
      } as HrmEmployeeApi.RegularReq);
      message.success('转正办理成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) return;
    const employee = modalApi.getData<HrmEmployeeApi.Employee>();
    if (!employee) return;
    disabledLeaderIds.value = employee.id ? [employee.id] : [];
    leaderEmployeeId.value = employee.leaderEmployeeId;
    modalApi.setState({ title: '办理转正' });
    await formApi.resetForm();
    await formApi.setValues({
      employeeId: employee.id,
      employeeName: employee.name,
      currentPostName: employee.postName,
      reason: HrmEmployeeChangeReason.ORGANIZATION_ADJUSTMENT,
      newDeptId: employee.deptId,
      newPostName: employee.postName,
      newPostLevel: employee.postLevel,
      newWorkAddress: employee.workAddress,
      effectTime: dayjs().startOf('day').valueOf(),
    });
  },
});
</script>

<template>
  <Modal class="w-[760px]">
    <Form class="mx-4">
      <template #newLeaderEmployeeId>
        <EmployeeSelect
          v-model="leaderEmployeeId"
          :disabled-ids="disabledLeaderIds"
          placeholder="请选择直属上级"
        />
      </template>
    </Form>
  </Modal>
</template>
