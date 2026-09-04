<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { computed, nextTick, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Spin,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getEmployeeCertificateList } from '#/api/hrm/portal/employee/certificate';
import { getEmployeeContactList } from '#/api/hrm/portal/employee/contact';
import { getEmployeeEducationExperienceList } from '#/api/hrm/portal/employee/education-experience';
import { getEmployeeTrainingExperienceList } from '#/api/hrm/portal/employee/training-experience';
import { getEmployeeWorkExperienceList } from '#/api/hrm/portal/employee/work-experience';
import { DictTag } from '#/components/dict-tag';
import {
  formatHrmDate,
  formatHrmDateTime,
  formatHrmEmployeeIdType,
} from '#/views/hrm/utils/format';

import {
  useCertificateGridColumns,
  useContactGridColumns,
  useEducationGridColumns,
  useTrainingGridColumns,
  useWorkGridColumns,
} from '../data';

defineOptions({ name: 'HrmPortalEmployeeBaseInfo' });

const props = defineProps<{
  employee: HrmPortalEmployeeApi.PortalEmployee;
  fieldConfigList: HrmEmployeeConfigApi.FieldConfig[];
}>();

const emit = defineEmits<{
  edit: [];
}>();

const { hasAccessByCodes } = useAccess();
const loading = ref(false);

const hasEditableFields = computed(() =>
  props.fieldConfigList.some((field) => field.editable),
);
const visibleFieldNames = computed(
  () =>
    new Set(
      props.fieldConfigList
        .filter((field) => field.visible)
        .map((field) => field.name),
    ),
);
const hasVisibleContactFields = computed(
  () => isVisible('mobile') || isVisible('email') || isVisible('address'),
);
const employeeReminder = computed(() =>
  hasEditableFields.value
    ? '可编辑的信息由公司管理员设置，如有问题，请联系公司管理员。'
    : '您的编辑权限已被管理员关闭，如有问题，请联系公司管理员。',
);

function createGridOptions(columns: any) {
  return {
    border: true,
    columns,
    data: [],
    minHeight: 180,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<any>;
}

const [EducationGrid, educationGridApi] = useVbenVxeGrid({
  gridOptions: createGridOptions(useEducationGridColumns()),
});
const [WorkGrid, workGridApi] = useVbenVxeGrid({
  gridOptions: createGridOptions(useWorkGridColumns()),
});
const [CertificateGrid, certificateGridApi] = useVbenVxeGrid({
  gridOptions: createGridOptions(useCertificateGridColumns()),
});
const [TrainingGrid, trainingGridApi] = useVbenVxeGrid({
  gridOptions: createGridOptions(useTrainingGridColumns()),
});
const [ContactGrid, contactGridApi] = useVbenVxeGrid({
  gridOptions: createGridOptions(useContactGridColumns()),
});

/** 判断字段是否允许员工查看 */
function isVisible(name: string) {
  return visibleFieldNames.value.has(name);
}

/** 获得员工个人信息各子模块 */
async function getList() {
  loading.value = true;
  try {
    const [
      educationExperiences,
      workExperiences,
      certificates,
      trainingExperiences,
      contacts,
    ] = await Promise.all([
      getEmployeeEducationExperienceList(),
      getEmployeeWorkExperienceList(),
      getEmployeeCertificateList(),
      getEmployeeTrainingExperienceList(),
      getEmployeeContactList(),
    ]);
    await nextTick();
    await Promise.all([
      educationGridApi.grid.reloadData(educationExperiences),
      workGridApi.grid.reloadData(workExperiences),
      certificateGridApi.grid.reloadData(certificates),
      trainingGridApi.grid.reloadData(trainingExperiences),
      contactGridApi.grid.reloadData(contacts),
    ]);
  } finally {
    loading.value = false;
  }
}

defineExpose({ getList });

onMounted(() => {
  getList();
});
</script>

<template>
  <Spin :spinning="loading">
    <Alert
      :style="{ marginBottom: '15px' }"
      :message="employeeReminder"
      show-icon
      type="info"
    />

    <Card title="基本信息" :style="{ marginBottom: '15px' }">
      <template #extra>
        <Button
          v-if="
            hasEditableFields &&
            hasAccessByCodes(['hrm:portal:employee:update'])
          "
          type="link"
          @click="emit('edit')"
        >
          编辑
        </Button>
      </template>
      <Descriptions bordered :column="4" size="small">
        <DescriptionsItem v-if="isVisible('name')" label="姓名">
          {{ employee.name || '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('sex')" label="性别">
          <DictTag
            v-if="employee.sex !== null"
            :type="DICT_TYPE.SYSTEM_USER_SEX"
            :value="employee.sex"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('birthday')" label="出生时间">
          {{ formatHrmDateTime(employee.birthday) }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('age')" label="年龄">
          {{ employee.age ?? '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('country')" label="国家或地区">
          {{ employee.country || '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('nation')" label="民族">
          {{ employee.nation || '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('nativePlace')" label="籍贯">
          {{ employee.nativePlace || '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('highestEducation')" label="最高学历">
          <DictTag
            v-if="employee.highestEducation !== null"
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="employee.highestEducation"
          />
          <span v-else>-</span>
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('idType')" label="证件类型">
          {{ formatHrmEmployeeIdType(employee.idType) }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('idNumber')" label="证件号码">
          {{ employee.idNumber || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Card>

    <Card
      v-if="hasVisibleContactFields"
      :style="{ marginBottom: '15px' }"
      title="通讯信息"
    >
      <Descriptions bordered :column="4" size="small">
        <DescriptionsItem v-if="isVisible('mobile')" label="手机号">
          {{ employee.mobile || '-' }}
        </DescriptionsItem>
        <DescriptionsItem v-if="isVisible('email')" label="邮箱">
          {{ employee.email || '-' }}
        </DescriptionsItem>
        <DescriptionsItem
          v-if="isVisible('address')"
          label="户籍地址"
          :span="4"
        >
          {{ employee.address || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="教育经历">
      <EducationGrid class="w-full">
        <template #education="{ row }">
          <DictTag
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="row.education"
          />
        </template>
        <template #admissionTime="{ row }">
          {{ formatHrmDate(row.admissionTime) }}
        </template>
        <template #graduationTime="{ row }">
          {{ formatHrmDate(row.graduationTime) }}
        </template>
      </EducationGrid>
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="工作经历">
      <WorkGrid class="w-full">
        <template #startTime="{ row }">
          {{ formatHrmDate(row.startTime) }}
        </template>
        <template #endTime="{ row }">
          {{ formatHrmDate(row.endTime) }}
        </template>
      </WorkGrid>
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="证书/证件">
      <CertificateGrid class="w-full">
        <template #issuingTime="{ row }">
          {{ formatHrmDate(row.issuingTime) }}
        </template>
      </CertificateGrid>
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="培训经历">
      <TrainingGrid class="w-full">
        <template #trainingTime="{ row }">
          {{ formatHrmDate(row.startTime) }} 至
          {{ formatHrmDate(row.endTime) }}
        </template>
      </TrainingGrid>
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="联系人">
      <ContactGrid class="w-full" />
    </Card>
  </Spin>
</template>
