<script lang="ts" setup>
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import {
  getInsuranceMonthEmployeeRecord,
  updateInsuranceMonthEmployeeRecord,
} from '#/api/hrm/insurance/month-record/employee';
import { getInsuranceScheme } from '#/api/hrm/insurance/scheme';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';

import { useEmployeeRecordFormSchema } from '../data';
import ProjectGrid from './project-grid.vue';

defineOptions({ name: 'HrmInsuranceEmployeeRecordForm' });

const emit = defineEmits(['success']);
const formData =
  ref<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>({
    socialSecurityProjectList: [],
    providentFundProjectList: [],
  });
const projectList = ref<HrmInsuranceMonthEmployeeRecordApi.Project[]>([]);
const isProportionScheme = computed(
  () => formData.value.schemeType === HrmInsuranceSchemeType.PROPORTION,
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 86,
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: useEmployeeRecordFormSchema(handleSchemeChange),
  showDefaultActions: false,
});

function buildProjectUpdateList(): HrmInsuranceMonthEmployeeRecordApi.ProjectUpdateReq[] {
  return projectList.value.map((project) => ({
    schemeProjectId: project.schemeProjectId!,
    ...(isProportionScheme.value
      ? { baseAmount: project.baseAmount }
      : {
          corporateAmount: project.corporateAmount,
          personalAmount: project.personalAmount,
        }),
  }));
}

async function handleSchemeChange(
  scheme?: HrmInsuranceSchemeApi.InsuranceScheme,
) {
  formData.value.schemeId = scheme?.id;
  if (!scheme?.id) {
    projectList.value = [];
    return;
  }
  const detail = await getInsuranceScheme(scheme.id);
  formData.value.schemeType = detail.type;
  projectList.value = (detail.projectList || []).map((project) => ({
    ...project,
    schemeProjectId: project.id,
  }));
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    const values = await formApi.getValues();
    if (!valid || !formData.value.id || !values.schemeId) return;
    modalApi.lock();
    try {
      await updateInsuranceMonthEmployeeRecord({
        id: formData.value.id,
        schemeId: values.schemeId as number,
        projects: buildProjectUpdateList(),
      });
      message.success('修改成功');
      await modalApi.close();
      emit('success');
    } finally {
      modalApi.unlock();
    }
  },
  async onOpenChange(isOpen) {
    if (!isOpen) return;
    const row =
      modalApi.getData() as HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord;
    if (!row?.id) return;
    modalApi.lock();
    try {
      const detail = await getInsuranceMonthEmployeeRecord(row.id);
      formData.value = { ...detail };
      projectList.value = [
        ...(detail.socialSecurityProjectList || []),
        ...(detail.providentFundProjectList || []),
      ].map((project) => ({ ...project }));
      await formApi.reset();
      await formApi.setValues({
        employeeDisplay: `${detail.employeeName || ''}${detail.jobNumber ? ` / ${detail.jobNumber}` : ''}`,
        schemeId: detail.schemeId,
        status: detail.status,
      });
      modalApi.setState({ title: '调整参保方案' });
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[960px]">
    <Form class="mx-4" />
    <ProjectGrid
      class="mx-4 mb-4"
      :rows="projectList"
      :scheme-type="formData.schemeType"
    />
  </Modal>
</template>
