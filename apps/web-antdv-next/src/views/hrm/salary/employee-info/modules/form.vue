<script lang="ts" setup>
import type { Rule } from 'antdv-next';
import type { Dayjs } from 'dayjs';

import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';
import { fromTimestampPickerValue, toTimestampPickerValue } from '@vben/utils';

import {
  Alert,
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Row,
  Select,
  Table,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getSalaryChangeRecord } from '#/api/hrm/salary/change-record';
import { getSalaryChangeTemplateList } from '#/api/hrm/salary/config/change-template';
import { getSalaryOptionSimpleList } from '#/api/hrm/salary/config/option';
import {
  getSalaryAdjustmentMinEffectDate,
  getSalaryEmployeeInfo,
  updateSalaryEmployeeInfo,
} from '#/api/hrm/salary/employee-info';
import { $t } from '#/locales';
import HrmEmployeeSelect from '#/views/hrm/employee/components/employee-select.vue';
import {
  HrmSalaryChangeReason,
  HrmSalaryOptionCategoryCode,
  HrmSalaryRecordType,
} from '#/views/hrm/utils/constants';

import ChangeTemplateSelect from '../components/change-template-select.vue';

defineOptions({ name: 'HrmSalaryEmployeeInfoForm' });

const emit = defineEmits(['success']);

const formRef = ref();
const formLoading = ref(false);
const dialogTitle = ref('定薪/调薪');
const employeeDisabled = ref(false);
const salaryOptionList = ref<HrmSalaryOptionApi.SalaryOption[]>([]);
const salaryTemplateList = ref<
  HrmSalaryChangeTemplateApi.SalaryChangeTemplate[]
>([]);
const selectedTemplateId = ref<number>();
const minEffectDate = ref<string>();
const beforeTotal = ref(0);
const probationBeforeTotal = ref(0);
let salaryDraftMap = new Map<number, HrmSalaryOptionApi.OptionValue>();
let probationDraftMap = new Map<number, HrmSalaryOptionApi.OptionValue>();

const formData = ref<HrmSalaryEmployeeInfoApi.UpdateReq>(
  createDefaultFormData(),
);
const formRules = reactive<Record<string, Rule[]>>({
  employeeId: [{ required: true, message: '员工不能为空', trigger: 'change' }],
  recordType: [
    { required: true, message: '记录类型不能为空', trigger: 'change' },
  ],
  changeReason: [
    { required: true, message: '调整原因不能为空', trigger: 'change' },
  ],
  effectTime: [
    { required: true, message: '生效日期不能为空', trigger: 'change' },
  ],
});

const salaryOptionRows = computed(() => {
  const regularOptions = formData.value.salaryOptions || [];
  const probationOptions = formData.value.probationSalaryOptions || [];
  const regularOptionMap = new Map(
    regularOptions.map((option) => [option.code, option]),
  );
  const probationOptionMap = new Map(
    probationOptions.map((option) => [option.code, option]),
  );
  const optionCodes = [
    ...new Set([
      ...regularOptions.map((option) => option.code),
      ...probationOptions.map((option) => option.code),
    ]),
  ];
  return optionCodes.map((code) => ({
    code,
    name:
      regularOptionMap.get(code)?.name || probationOptionMap.get(code)?.name,
    regularOption: regularOptionMap.get(code) || { code, value: 0 },
    probationOption: probationOptionMap.get(code) || { code, value: 0 },
  }));
});

const showChangeFields = computed(
  () => formData.value.recordType === HrmSalaryRecordType.CHANGE,
);

function isPendingChange() {
  return (
    formData.value.recordType === HrmSalaryRecordType.CHANGE &&
    !!formData.value.effectTime &&
    dayjs(Number(formData.value.effectTime)).isAfter(dayjs(), 'day')
  );
}

function disabledEffectDate(current: Dayjs) {
  return (
    !!minEffectDate.value && current.isBefore(dayjs(minEffectDate.value), 'day')
  );
}

function createDefaultFormData(): HrmSalaryEmployeeInfoApi.UpdateReq {
  return {
    employeeId: undefined,
    recordType: HrmSalaryRecordType.FIXED,
    changeReason: HrmSalaryChangeReason.ENTRY_SALARY,
    effectTime: dayjs().startOf('month').valueOf(),
    remark: '',
    salaryOptions: [],
    probationSalaryOptions: [],
  };
}

function buildDefaultOptionValues() {
  return salaryOptionList.value.map((item) => ({
    code: item.code,
    name: item.name,
    value: 0,
  }));
}

function resetDraftMaps(
  salaryOptions: HrmSalaryOptionApi.OptionValue[] = [],
  probationSalaryOptions: HrmSalaryOptionApi.OptionValue[] = [],
) {
  salaryDraftMap = new Map(
    salaryOptions
      .filter((item) => item.code !== undefined)
      .map((item) => [item.code as number, { ...item }]),
  );
  probationDraftMap = new Map(
    probationSalaryOptions
      .filter((item) => item.code !== undefined)
      .map((item) => [item.code as number, { ...item }]),
  );
}

function syncDraftMaps() {
  for (const item of formData.value.salaryOptions || []) {
    if (item.code !== undefined) {
      salaryDraftMap.set(item.code, { ...item });
    }
  }
  for (const item of formData.value.probationSalaryOptions || []) {
    if (item.code !== undefined) {
      probationDraftMap.set(item.code, { ...item });
    }
  }
}

function getSelectedOptionDefinitions(): HrmSalaryChangeTemplateApi.ChangeOption[] {
  const template = salaryTemplateList.value.find(
    (item) => item.id === selectedTemplateId.value,
  );
  if (template?.options?.length) {
    return template.options.map((item) => ({
      code: item.code,
      name: item.name,
    }));
  }
  return salaryOptionList.value.map((item) => ({
    code: item.code,
    name: item.name,
  }));
}

function buildSelectedOptions(
  draftMap: Map<number, HrmSalaryOptionApi.OptionValue>,
) {
  return getSelectedOptionDefinitions()
    .filter((item) => item.code !== undefined)
    .map((item) => {
      const current = draftMap.get(item.code as number);
      return {
        code: item.code,
        name: item.name || current?.name,
        value: current?.value ?? 0,
      };
    });
}

function applySelectedTemplate(syncDraft = true) {
  if (syncDraft) {
    syncDraftMaps();
  }
  formData.value.salaryOptions = buildSelectedOptions(salaryDraftMap);
  formData.value.probationSalaryOptions =
    buildSelectedOptions(probationDraftMap);
}

function selectDefaultTemplate() {
  selectedTemplateId.value = salaryTemplateList.value.find(
    (item) => item.defaultStatus,
  )?.id;
}

async function loadSimpleData() {
  const [options, templates, adjustmentMinEffectDate] = await Promise.all([
    getSalaryOptionSimpleList(),
    getSalaryChangeTemplateList(),
    getSalaryAdjustmentMinEffectDate(),
  ]);
  salaryOptionList.value = options.filter(
    (item) =>
      item.parentCode !== HrmSalaryOptionCategoryCode.ROOT &&
      item.calculateEnabled,
  );
  salaryTemplateList.value = templates || [];
  minEffectDate.value = adjustmentMinEffectDate || undefined;
  selectDefaultTemplate();
}

async function loadSalaryEmployee() {
  if (!formData.value.employeeId) {
    return;
  }
  formLoading.value = true;
  try {
    const salaryEmployee = await getSalaryEmployeeInfo(
      formData.value.employeeId,
    );
    if (salaryEmployee?.id) {
      formData.value.recordType = HrmSalaryRecordType.CHANGE;
      beforeTotal.value = salaryEmployee.regularSalary || 0;
      probationBeforeTotal.value = salaryEmployee.probationSalary || 0;
      resetDraftMaps(
        salaryEmployee.salaryOptions?.length
          ? salaryEmployee.salaryOptions
          : buildDefaultOptionValues(),
        salaryEmployee.probationSalaryOptions?.length
          ? salaryEmployee.probationSalaryOptions
          : buildDefaultOptionValues(),
      );
    } else {
      formData.value.recordType = HrmSalaryRecordType.FIXED;
      beforeTotal.value = 0;
      probationBeforeTotal.value = 0;
      resetDraftMaps(buildDefaultOptionValues(), buildDefaultOptionValues());
    }
    applySelectedTemplate(false);
  } finally {
    formLoading.value = false;
  }
}

function resetForm() {
  formData.value = createDefaultFormData();
  beforeTotal.value = 0;
  probationBeforeTotal.value = 0;
  selectedTemplateId.value = undefined;
  employeeDisabled.value = false;
  salaryDraftMap = new Map();
  probationDraftMap = new Map();
  formRef.value?.clearValidate();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    await formRef.value?.validate();
    modalApi.lock();
    formLoading.value = true;
    try {
      await updateSalaryEmployeeInfo(formData.value);
      message.success($t('ui.actionMessage.updateSuccess'));
      await modalApi.close();
      emit('success');
    } finally {
      formLoading.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetForm();
    }
  },
});

async function open(employeeId?: number, recordId?: number) {
  dialogTitle.value = '定薪/调薪';
  resetForm();
  modalApi.setState({ title: dialogTitle.value });
  modalApi.open();
  formLoading.value = true;
  try {
    await loadSimpleData();
    if (recordId) {
      dialogTitle.value = '编辑定薪调薪记录';
      modalApi.setState({ title: dialogTitle.value });
      employeeDisabled.value = true;
      selectedTemplateId.value = undefined;
      const record = await getSalaryChangeRecord(recordId);
      beforeTotal.value = record.beforeTotal || 0;
      probationBeforeTotal.value = record.probationBeforeTotal || 0;
      formData.value = {
        id: record.id,
        employeeId: record.employeeId || employeeId,
        recordType: record.recordType,
        changeReason: record.changeReason,
        effectTime: record.effectTime,
        remark: record.remark,
        salaryOptions: (record.salaryOptions || []).map((item) => ({
          ...item,
        })),
        probationSalaryOptions: (record.probationSalaryOptions || []).map(
          (item) => ({ ...item }),
        ),
      };
      resetDraftMaps(record.salaryOptions, record.probationSalaryOptions);
    } else if (employeeId) {
      employeeDisabled.value = true;
      formData.value.employeeId = employeeId;
      await loadSalaryEmployee();
    } else {
      selectDefaultTemplate();
      resetDraftMaps(buildDefaultOptionValues(), buildDefaultOptionValues());
      applySelectedTemplate(false);
    }
  } finally {
    formLoading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal :title="dialogTitle" class="w-[980px]">
    <Form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="104px"
    >
      <Row :gutter="20">
        <Col :span="6">
          <FormItem label="员工" name="employeeId">
            <HrmEmployeeSelect
              v-model="formData.employeeId"
              :disabled="employeeDisabled || !!formData.id"
              class="w-full"
              placeholder="请选择员工"
              @change="loadSalaryEmployee"
            />
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="记录类型" name="recordType">
            <RadioGroup v-model:value="formData.recordType" disabled>
              <Radio :value="HrmSalaryRecordType.FIXED">定薪</Radio>
              <Radio :value="HrmSalaryRecordType.CHANGE">调薪</Radio>
            </RadioGroup>
          </FormItem>
        </Col>
        <Col :span="6">
          <FormItem label="调薪模板">
            <ChangeTemplateSelect
              v-model="selectedTemplateId"
              @change="applySelectedTemplate()"
            />
          </FormItem>
        </Col>
        <Col v-if="showChangeFields" :span="6">
          <FormItem label="生效日期" name="effectTime">
            <DatePicker
              :value="toTimestampPickerValue(formData.effectTime)"
              :disabled-date="disabledEffectDate"
              class="w-full"
              value-format="x"
              @update:value="
                formData.effectTime = fromTimestampPickerValue($event)
              "
            />
          </FormItem>
        </Col>
      </Row>

      <Row v-if="showChangeFields" :gutter="20">
        <Col :span="8">
          <FormItem label="调整原因" name="changeReason">
            <Select
              v-model:value="formData.changeReason"
              :options="
                getDictOptions(DICT_TYPE.HRM_SALARY_CHANGE_REASON, 'number')
              "
              class="w-full"
              placeholder="请选择调整原因"
            />
          </FormItem>
        </Col>
        <Col :span="8">
          <FormItem label="调整前正式">
            <InputNumber
              :min="0"
              :precision="2"
              :value="beforeTotal"
              class="w-full"
              disabled
            />
          </FormItem>
        </Col>
        <Col :span="8">
          <FormItem label="调整前试用">
            <InputNumber
              :min="0"
              :precision="2"
              :value="probationBeforeTotal"
              class="w-full"
              disabled
            />
          </FormItem>
        </Col>
      </Row>

      <Alert
        v-if="isPendingChange()"
        class="mb-4"
        message="该调整将在生效日期前保持待生效，当前薪资档案不会提前变化"
        show-icon
        type="warning"
      />

      <div class="mb-2 font-medium">薪资明细</div>
      <Table
        bordered
        size="small"
        :data-source="salaryOptionRows"
        :loading="formLoading"
        :pagination="false"
        :row-key="(row) => row.code ?? 0"
        :columns="[
          { title: '薪资项', dataIndex: 'name', key: 'name' },
          {
            title: '编码',
            dataIndex: 'code',
            key: 'code',
            align: 'center',
            width: 100,
          },
          {
            title: '试用期工资',
            key: 'probation',
            align: 'center',
            width: 220,
          },
          { title: '转正后工资', key: 'regular', align: 'center', width: 220 },
        ]"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'probation'">
            <InputNumber
              v-model:value="record.probationOption.value"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </template>
          <template v-else-if="column.key === 'regular'">
            <InputNumber
              v-model:value="record.regularOption.value"
              :min="0"
              :precision="2"
              class="w-full"
            />
          </template>
        </template>
      </Table>

      <FormItem class="mt-4" label="备注" name="remark">
        <Input.TextArea
          v-model:value="formData.remark"
          :maxlength="500"
          :rows="3"
          show-count
        />
      </FormItem>
    </Form>
  </Modal>
</template>
