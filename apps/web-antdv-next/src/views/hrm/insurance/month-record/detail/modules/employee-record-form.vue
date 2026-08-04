<script lang="ts" setup>
import type { HrmInsuranceMonthEmployeeRecordApi } from '#/api/hrm/insurance/month-record/employee';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { computed, ref } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { InputNumber, message, Table } from 'antdv-next';

import {
  getInsuranceMonthEmployeeRecord,
  updateInsuranceMonthEmployeeRecord,
} from '#/api/hrm/insurance/month-record/employee';
import { getInsuranceScheme } from '#/api/hrm/insurance/scheme';
import { DictTag } from '#/components/dict-tag';
import InsuranceSchemeSelect from '#/views/hrm/insurance/scheme/components/insurance-scheme-select.vue';
import { HrmInsuranceSchemeType } from '#/views/hrm/utils/constants';
import { formatHrmRate } from '#/views/hrm/utils/format';

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
  schema: [
    {
      fieldName: 'employeeDisplay',
      label: '员工',
      component: 'Input',
      componentProps: { disabled: true },
    },
    {
      fieldName: 'schemeId',
      label: '社保方案',
      component: 'Input',
      rules: 'required',
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Input',
    },
  ],
  showDefaultActions: false,
});

const projectColumns = computed(() => {
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      width: 130,
    },
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
    if (!valid || !formData.value.id || !values.schemeId) {
      return;
    }
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
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      return;
    }
    const row =
      modalApi.getData<HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord>();
    if (!row?.id) {
      return;
    }
    modalApi.lock();
    try {
      const detail = await getInsuranceMonthEmployeeRecord(row.id);
      formData.value = { ...detail };
      projectList.value = [
        ...(detail.socialSecurityProjectList || []),
        ...(detail.providentFundProjectList || []),
      ].map((project) => ({ ...project }));
      await formApi.resetForm();
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

defineExpose({
  open: (
    row: HrmInsuranceMonthEmployeeRecordApi.InsuranceMonthEmployeeRecord,
  ) => {
    modalApi.setData(row).open();
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
      <template #status="{ model, field }">
        <DictTag
          :type="DICT_TYPE.HRM_INSURANCE_EMP_STATUS"
          :value="model[field] ?? ''"
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
