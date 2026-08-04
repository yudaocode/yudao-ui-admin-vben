<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';
import dayjs from 'dayjs';

import { quitEmployee } from '#/api/hrm/employee';
import { getEmployeeQuitInfo } from '#/api/hrm/employee/quit-info';
import {
  HrmEmployeeEntryStatus,
  HrmEmployeeQuitReason,
  HrmEmployeeQuitType,
} from '#/views/hrm/utils/constants';

import { useQuitFormSchema } from '../data';

defineOptions({ name: 'HrmEmployeeQuitForm' });

const emit = defineEmits(['success']);
const quitType = ref<number>(HrmEmployeeQuitType.VOLUNTARY);
const schema = computed(() => useQuitFormSchema(quitType.value));

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: schema as any,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    try {
      await quitEmployee(await formApi.getValues());
      message.success('离职信息保存成功');
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
    const isLeft = employee.entryStatus === HrmEmployeeEntryStatus.LEFT;
    modalApi.setState({ title: isLeft ? '修改离职信息' : '办理离职' });
    await formApi.resetForm();
    await formApi.setValues({
      employeeId: employee.id,
      employeeName: employee.name,
      currentPostName: employee.postName,
      applyQuitTime: dayjs().startOf('day').valueOf(),
      type: HrmEmployeeQuitType.VOLUNTARY,
      reason: HrmEmployeeQuitReason.FAMILY,
    });
    if (employee.id) {
      modalApi.lock();
      try {
        const quitInfo = await getEmployeeQuitInfo(employee.id);
        if (quitInfo) {
          quitType.value = quitInfo.type ?? HrmEmployeeQuitType.VOLUNTARY;
          await formApi.setValues({ ...quitInfo, employeeId: employee.id });
        }
      } finally {
        modalApi.unlock();
      }
    }
  },
});
</script>

<template>
  <Modal class="w-[680px]">
    <Form class="mx-4" />
  </Modal>
</template>
