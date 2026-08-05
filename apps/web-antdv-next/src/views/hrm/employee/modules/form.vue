<script lang="ts" setup>
import type { HrmEmployeeApi } from '#/api/hrm/employee';
import type { HrmRecruitCandidateApi } from '#/api/hrm/recruit/candidate';

import { computed, ref, watch } from 'vue';

import { useVbenForm, useVbenModal } from '@vben/common-ui';

import { message, TabPane, Tabs } from 'antdv-next';

import {
  confirmEmployeeEntry,
  createEmployee,
  getEmployee,
  rehireEmployee,
  updateEmployee,
} from '#/api/hrm/employee';
import { getEmployeeCreateFieldConfigList } from '#/api/hrm/employee/config';
import { convertRecruitCandidateToEmployee } from '#/api/hrm/recruit/candidate';
import { $t } from '#/locales';
import {
  HRM_EMPLOYEE_NO_PROBATION_MONTHS,
  HrmEmployeeEntryStatus,
} from '#/views/hrm/utils/constants';
import { UserSelect } from '#/views/system/user/components';

import EmployeeSelect from '../components/employee-select.vue';
import {
  createDefaultEmployeeFormData,
  useEmployeeEntryFormSchema,
  useEmployeePersonalFormSchema,
} from '../data';

defineOptions({ name: 'HrmEmployeeForm' });

const emit = defineEmits(['success']);

const formType = ref('create');
const activeTab = ref('personal');
const createFieldVisibleMap = ref<Record<number, Set<string>>>({});
const leaderEmployeeId = ref<number>();
const userId = ref<number>();
const candidateId = ref<number>();

const modalTitle = computed(() => {
  if (formType.value === 'confirm') return '确认入职';
  if (formType.value === 'rehire') return '办理再入职';
  if (formType.value === 'candidate') return '候选人转员工';
  if (formType.value === 'create') return '新增员工';
  return '编辑员工';
});

function isFieldVisible(name: string) {
  if (formType.value === 'update') {
    return true;
  }
  const entryStatus =
    entryFormApi.form?.values?.entryStatus || HrmEmployeeEntryStatus.ACTIVE;
  const visibleFields = createFieldVisibleMap.value[entryStatus];
  return !visibleFields || visibleFields.has(name);
}

const personalSchema = computed(() =>
  useEmployeePersonalFormSchema(isFieldVisible),
);
const entrySchema = computed(() =>
  useEmployeeEntryFormSchema(isFieldVisible, formType.value),
);

const [Form, formApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

const [EntryForm, entryFormApi] = useVbenForm({
  commonConfig: { labelWidth: 112, componentProps: { class: 'w-full' } },
  layout: 'horizontal',
  schema: [],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

watch(personalSchema, (schema) => formApi.setState({ schema }), {
  immediate: true,
});
watch(entrySchema, (schema) => entryFormApi.setState({ schema }), {
  immediate: true,
});

async function loadCreateFieldConfig() {
  const [activeFields, pendingEntryFields] = await Promise.all([
    getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.ACTIVE),
    getEmployeeCreateFieldConfigList(HrmEmployeeEntryStatus.PENDING_ENTRY),
  ]);
  createFieldVisibleMap.value = {
    [HrmEmployeeEntryStatus.ACTIVE]: new Set(
      activeFields.filter((f) => f.visible).map((f) => f.name),
    ),
    [HrmEmployeeEntryStatus.PENDING_ENTRY]: new Set(
      pendingEntryFields.filter((f) => f.visible).map((f) => f.name),
    ),
  };
}

function buildSubmitData(values: HrmEmployeeApi.Employee) {
  if (formType.value === 'update') {
    return values;
  }
  const entryStatus = values.entryStatus || HrmEmployeeEntryStatus.ACTIVE;
  const visibleFields = createFieldVisibleMap.value[entryStatus];
  if (!visibleFields) {
    return values;
  }
  const submitData: Partial<HrmEmployeeApi.Employee> = {};
  for (const [name, value] of Object.entries(values)) {
    if (visibleFields.has(name)) {
      submitData[name as keyof HrmEmployeeApi.Employee] = value as never;
    }
  }
  if (formType.value === 'confirm' || formType.value === 'rehire') {
    submitData.id = values.id;
  } else if (formType.value === 'candidate') {
    submitData.candidateId = candidateId.value ?? values.candidateId;
  }
  return submitData as HrmEmployeeApi.Employee;
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const [personalValid, entryValid] = await Promise.all([
      formApi.validate(),
      entryFormApi.validate(),
    ]);
    if (!personalValid.valid || !entryValid.valid) {
      return;
    }
    modalApi.lock();
    try {
      const values = {
        ...(await formApi.getValues()),
        ...(await entryFormApi.getValues()),
        leaderEmployeeId: leaderEmployeeId.value,
        userId: userId.value,
        candidateId: candidateId.value,
      } as HrmEmployeeApi.Employee;
      const submitData = buildSubmitData(values);
      if (formType.value === 'create') {
        await createEmployee(submitData);
        message.success($t('ui.actionMessage.createSuccess'));
      } else if (formType.value === 'candidate') {
        await convertRecruitCandidateToEmployee(
          submitData as HrmRecruitCandidateApi.EntryReq,
        );
        message.success($t('ui.actionMessage.createSuccess'));
      } else if (formType.value === 'confirm') {
        await confirmEmployeeEntry(submitData);
        message.success('已确认入职');
      } else if (formType.value === 'rehire') {
        await rehireEmployee({ ...submitData, employeeId: values.id });
        message.success('再入职办理成功');
      } else {
        await updateEmployee(values);
        message.success($t('ui.actionMessage.updateSuccess'));
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
    const data = modalApi.getData<{
      defaultData?: Partial<HrmEmployeeApi.Employee>;
      id?: number;
      type?: string;
    }>();
    formType.value = data?.type || 'create';
    activeTab.value = 'personal';
    modalApi.setState({ title: modalTitle.value });
    const defaults = createDefaultEmployeeFormData();
    await formApi.resetForm();
    await entryFormApi.resetForm();
    await formApi.setValues(defaults);
    await entryFormApi.setValues(defaults);
    leaderEmployeeId.value = undefined;
    userId.value = undefined;
    candidateId.value = undefined;
    modalApi.lock();
    try {
      if (formType.value !== 'update') {
        await loadCreateFieldConfig();
      }
      if (data?.id) {
        const employee = await getEmployee(data.id);
        await formApi.setValues(employee);
        await entryFormApi.setValues(employee);
        leaderEmployeeId.value = employee.leaderEmployeeId;
        userId.value = employee.userId;
        candidateId.value = employee.candidateId;
        if (formType.value === 'confirm') {
          await entryFormApi.setFieldValue(
            'entryStatus',
            HrmEmployeeEntryStatus.ACTIVE,
          );
          if (!employee.entryTime || Number(employee.entryTime) > Date.now()) {
            const entryTime = Date.now();
            await entryFormApi.setFieldValue('entryTime', entryTime);
            await entryFormApi.setFieldValue('regularTime', undefined);
            await entryFormApi.setFieldValue('companyAgeStartTime', entryTime);
          }
        } else if (formType.value === 'rehire') {
          const entryTime = Date.now();
          await entryFormApi.setValues({
            entryStatus: HrmEmployeeEntryStatus.ACTIVE,
            entryTime,
            companyAgeStartTime: entryTime,
            regularTime: undefined,
            leaveTime: undefined,
            probation: HRM_EMPLOYEE_NO_PROBATION_MONTHS,
          });
        }
      } else if (data?.defaultData) {
        const merged = { ...defaults, ...data.defaultData };
        await formApi.setValues(merged);
        await entryFormApi.setValues(merged);
        leaderEmployeeId.value = data.defaultData.leaderEmployeeId;
        userId.value = data.defaultData.userId;
        candidateId.value = data.defaultData.candidateId;
      }
    } finally {
      modalApi.unlock();
    }
  },
});
</script>

<template>
  <Modal class="w-[1040px]">
    <Tabs v-model:active-key="activeTab">
      <TabPane key="personal" tab="个人信息">
        <Form class="mx-4 mt-2">
          <template #userId>
            <UserSelect v-model="userId" placeholder="请选择后台用户" />
          </template>
        </Form>
      </TabPane>
      <TabPane key="entry" tab="入职信息">
        <EntryForm class="mx-4 mt-2">
          <template #leaderEmployeeId>
            <EmployeeSelect
              v-model="leaderEmployeeId"
              placeholder="请选择直属上级"
            />
          </template>
        </EntryForm>
      </TabPane>
    </Tabs>
  </Modal>
</template>
