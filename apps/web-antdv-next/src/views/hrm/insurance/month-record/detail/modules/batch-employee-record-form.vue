<script lang="ts" setup>
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { InputNumber, Table } from 'antdv-next';

import { updateInsuranceMonthEmployeeRecord } from '#/api/hrm/insurance/month-record/employee';
import { getInsuranceScheme } from '#/api/hrm/insurance/scheme';
import { DictTag } from '#/components/dict-tag';
import InsuranceSchemeSelect from '#/views/hrm/insurance/scheme/components/insurance-scheme-select.vue';
import { executeBatch } from '#/views/hrm/utils/batch';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';
import { formatHrmRate } from '#/views/hrm/utils/format';

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
  schema: [
    {
      fieldName: 'employeeCount',
      label: '已选员工',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'schemeId',
      label: '社保方案',
      component: 'Input',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

const projectColumns = computed(() => {
  const columns = [
    { title: '类型', dataIndex: 'type', width: 130 },
    { title: '项目名称', dataIndex: 'name', minWidth: 150 },
  ];
  if (isProportionScheme.value) {
    columns.push(
      { title: '缴纳基数', dataIndex: 'baseAmount', width: 150 },
      { title: '公司比例', dataIndex: 'corporateRate', width: 120 },
      { title: '个人比例', dataIndex: 'personalRate', width: 120 },
    );
  } else {
    columns.push(
      { title: '公司金额', dataIndex: 'corporateAmount', width: 150 },
      { title: '个人金额', dataIndex: 'personalAmount', width: 150 },
    );
  }
  return columns;
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
    const ids = modalApi.getData<number[]>() || [];
    recordIds.value = ids;
    schemeId.value = undefined;
    schemeType.value = undefined;
    projectList.value = [];
    await formApi.resetForm();
    await formApi.setValues({
      employeeCount: `${ids.length} 人`,
      schemeId: undefined,
    });
    modalApi.setState({ title: '批量调整参保方案' });
  },
});

defineExpose({
  open: (ids: number[]) => {
    if (ids.length === 0) {
      return;
    }
    modalApi.setData(ids).open();
  },
});
</script>

<template>
  <Modal class="w-[960px]">
    <Form class="mx-4">
      <template #schemeId="{ model, field }">
        <InsuranceSchemeSelect
          v-model:model-value="model[field]"
          @change="handleSchemeChange"
        />
      </template>
    </Form>
    <Table
      :columns="projectColumns"
      :data-source="projectList"
      :pagination="false"
      bordered
      class="mx-4 mb-4"
      row-key="schemeProjectId"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'type'">
          <DictTag
            :type="DICT_TYPE.HRM_INSURANCE_PROJECT_TYPE"
            :value="record.type"
          />
        </template>
        <template v-else-if="column.dataIndex === 'baseAmount'">
          <InputNumber
            v-model:value="record.baseAmount"
            :controls="false"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'corporateRate'">
          {{ formatHrmRate(record.corporateRate) }}
        </template>
        <template v-else-if="column.dataIndex === 'personalRate'">
          {{ formatHrmRate(record.personalRate) }}
        </template>
        <template v-else-if="column.dataIndex === 'corporateAmount'">
          <InputNumber
            v-model:value="record.corporateAmount"
            :controls="false"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </template>
        <template v-else-if="column.dataIndex === 'personalAmount'">
          <InputNumber
            v-model:value="record.personalAmount"
            :controls="false"
            :min="0"
            :precision="2"
            class="w-full"
          />
        </template>
      </template>
    </Table>
  </Modal>
</template>
