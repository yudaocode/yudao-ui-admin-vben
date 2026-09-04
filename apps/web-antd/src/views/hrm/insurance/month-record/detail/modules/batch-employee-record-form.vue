<script lang="ts" setup>
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { updateInsuranceMonthEmployeeRecord } from '#/api/hrm/insurance/month-record/employee';
import { getInsuranceScheme } from '#/api/hrm/insurance/scheme';
import { executeBatch } from '#/views/hrm/utils/batch';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';

import { useBatchEmployeeRecordFormSchema } from '../data';
import ProjectGrid from './project-grid.vue';

defineOptions({ name: 'HrmInsuranceBatchEmployeeRecordForm' });

const emit = defineEmits(['success']);

const recordIds = ref<number[]>([]);
const schemeId = ref<number>();
const schemeType = ref<number>();
const projectList = ref<HrmInsuranceMonthEmployeeRecordApi.Project[]>([]);

const isProportionScheme = computed(
  () => schemeType.value === HrmInsuranceSchemeType.PROPORTION,
);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    labelWidth: 86,
    componentProps: { class: 'w-full' },
  },
  layout: 'horizontal',
  schema: useBatchEmployeeRecordFormSchema(handleSchemeChange),
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
  schemeId.value = scheme?.id;
  if (!scheme?.id) {
    projectList.value = [];
    schemeType.value = undefined;
    return;
  }
  const detail = await getInsuranceScheme(scheme.id);
  schemeType.value = detail.type;
  projectList.value = (detail.projectList || []).map((project) => ({
    ...project,
    schemeProjectId: project.id,
  }));
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid || !schemeId.value) {
      return;
    }
    modalApi.lock();
    try {
      const projects = buildProjectUpdateList();
      const success = await executeBatch(
        recordIds.value.map((id) =>
          updateInsuranceMonthEmployeeRecord({
            id,
            schemeId: schemeId.value!,
            projects,
          }),
        ),
      );
      if (!success) {
        return;
      }
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
    const ids = (modalApi.getData() as number[]) || [];
    recordIds.value = ids;
    schemeId.value = undefined;
    schemeType.value = undefined;
    projectList.value = [];
    await formApi.reset();
    await formApi.setValues({
      employeeCount: `${ids.length} 人`,
      schemeId: undefined,
    });
    modalApi.setState({ title: '批量调整参保方案' });
  },
});
</script>

<template>
  <Modal class="w-[960px]">
    <Form class="mx-4" />
    <ProjectGrid
      class="mx-4 mb-4"
      :rows="projectList"
      :scheme-type="schemeType"
    />
  </Modal>
</template>
