<script lang="ts" setup>
import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';
import type { HrmSalaryOptionApi } from '#/api/hrm/salary/config/option';
import type { HrmSalaryEmployeeInfoApi } from '#/api/hrm/salary/employee-info';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictOptions } from '@vben/hooks';

import dayjs from 'dayjs';
import {
  ElAlert,
  ElCol,
  ElDatePicker,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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

const formRules = reactive({
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

function disabledEffectDate(date: Date) {
  return (
    !!minEffectDate.value &&
    dayjs(date).isBefore(dayjs(minEffectDate.value), 'day')
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
      ElMessage.success($t('ui.actionMessage.updateSuccess'));
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
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      class="mx-4"
      label-width="104px"
    >
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElFormItem label="员工" prop="employeeId">
            <HrmEmployeeSelect
              v-model="formData.employeeId"
              :disabled="employeeDisabled || !!formData.id"
              class="w-full"
              placeholder="请选择员工"
              @change="loadSalaryEmployee"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="记录类型" prop="recordType">
            <ElRadioGroup v-model="formData.recordType" disabled>
              <ElRadio :value="HrmSalaryRecordType.FIXED">定薪</ElRadio>
              <ElRadio :value="HrmSalaryRecordType.CHANGE">调薪</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="调薪模板">
            <ChangeTemplateSelect
              v-model="selectedTemplateId"
              @change="applySelectedTemplate()"
            />
          </ElFormItem>
        </ElCol>
        <ElCol v-if="showChangeFields" :span="6">
          <ElFormItem label="生效日期" prop="effectTime">
            <ElDatePicker
              v-model="formData.effectTime"
              :disabled-date="disabledEffectDate"
              class="w-full!"
              type="date"
              value-format="x"
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow v-if="showChangeFields" :gutter="20">
        <ElCol :span="8">
          <ElFormItem label="调整原因" prop="changeReason">
            <ElSelect
              v-model="formData.changeReason"
              class="w-full"
              placeholder="请选择调整原因"
            >
              <ElOption
                v-for="item in getDictOptions(
                  DICT_TYPE.HRM_SALARY_CHANGE_REASON,
                  'number',
                )"
                :key="String(item.value)"
                :label="item.label"
                :value="item.value"
              />
            </ElSelect>
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="调整前正式">
            <ElInputNumber
              :min="0"
              :model-value="beforeTotal"
              :precision="2"
              class="w-full!"
              disabled
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="8">
          <ElFormItem label="调整前试用">
            <ElInputNumber
              :min="0"
              :model-value="probationBeforeTotal"
              :precision="2"
              class="w-full!"
              disabled
            />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElAlert
        v-if="isPendingChange()"
        class="mb-4"
        show-icon
        title="该调整将在生效日期前保持待生效，当前薪资档案不会提前变化"
        type="warning"
      />

      <div class="mb-2 font-medium">薪资明细</div>
      <ElTable
        v-loading="formLoading"
        border
        size="small"
        :data="salaryOptionRows"
      >
        <ElTableColumn label="薪资项" min-width="180" prop="name" />
        <ElTableColumn align="center" label="编码" prop="code" width="100" />
        <ElTableColumn align="center" label="试用期工资" width="220">
          <template #default="{ row }">
            <ElInputNumber
              v-model="row.probationOption.value"
              :min="0"
              :precision="2"
              class="w-full!"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn align="center" label="转正后工资" width="220">
          <template #default="{ row }">
            <ElInputNumber
              v-model="row.regularOption.value"
              :min="0"
              :precision="2"
              class="w-full!"
            />
          </template>
        </ElTableColumn>
      </ElTable>

      <ElFormItem class="mt-4" label="备注" prop="remark">
        <ElInput
          v-model="formData.remark"
          :maxlength="500"
          :rows="3"
          show-word-limit
          type="textarea"
        />
      </ElFormItem>
    </ElForm>
  </Modal>
</template>
