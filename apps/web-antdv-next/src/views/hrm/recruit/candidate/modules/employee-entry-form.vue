<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { confirmEmployeeEntry, getEmployee } from '#/api/hrm/employee';
import { convertRecruitCandidateToEmployee } from '#/api/hrm/recruit/candidate';
import { $t } from '#/locales';
import { HrmEmployeeEntryStatus } from '#/views/hrm/utils/constants';

import { useEmployeeEntryFormSchema } from '../data';

const emit = defineEmits(['success']);

/** 精简员工入职弹窗：candidate=转员工，confirm=确认入职（非完整 EmployeeForm） */
type EntryMode = 'candidate' | 'confirm';

const mode = ref<EntryMode>('candidate');
const getTitle = computed(() =>
  mode.value === 'confirm' ? '确认入职' : '候选人转员工',
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    labelWidth: 110,
  },
  wrapperClass: 'grid-cols-2',
  layout: 'horizontal',
  schema: useEmployeeEntryFormSchema(),
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
    const values = (await formApi.getValues()) as HrmEmployeeApi.Employee & {
      candidateId?: number;
    };
    if (values.entryTime) {
      values.entryTime = Number(values.entryTime);
    }
    if (values.companyAgeStartTime) {
      values.companyAgeStartTime = Number(values.companyAgeStartTime);
    }
    try {
      if (mode.value === 'candidate') {
        await convertRecruitCandidateToEmployee(
          values as HrmRecruitCandidateApi.EntryReq,
        );
        message.success($t('ui.actionMessage.operationSuccess'));
      } else {
        await confirmEmployeeEntry(values);
        message.success('已确认入职');
      }
      // 关闭并提示
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      mode.value = 'candidate';
      return;
    }
    // 加载数据
    const data = modalApi.getData<{
      defaultData?: Partial<HrmEmployeeApi.Employee>;
      employeeId?: number;
      mode: EntryMode;
    }>();
    if (!data) {
      return;
    }
    mode.value = data.mode;
    if (data.mode === 'confirm' && data.employeeId) {
      modalApi.lock();
      try {
        const employee = await getEmployee(data.employeeId);
        employee.entryStatus = HrmEmployeeEntryStatus.ACTIVE;
        if (!employee.entryTime || Number(employee.entryTime) > Date.now()) {
          const entryTime = Date.now();
          employee.entryTime = entryTime;
          if (
            !employee.companyAgeStartTime ||
            Number(employee.companyAgeStartTime) > entryTime
          ) {
            employee.companyAgeStartTime = entryTime;
          }
        }
        await formApi.setValues({
          ...employee,
          entryTime: employee.entryTime
            ? String(employee.entryTime)
            : undefined,
          companyAgeStartTime: employee.companyAgeStartTime
            ? String(employee.companyAgeStartTime)
            : undefined,
        });
      } finally {
        modalApi.unlock();
      }
      return;
    }
    const defaults = data.defaultData ?? {};
    await formApi.setValues({
      ...defaults,
      entryTime: defaults.entryTime ? String(defaults.entryTime) : undefined,
      companyAgeStartTime: defaults.companyAgeStartTime
        ? String(defaults.companyAgeStartTime)
        : undefined,
    });
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[820px]">
    <Form class="mx-4" />
  </Modal>
</template>
