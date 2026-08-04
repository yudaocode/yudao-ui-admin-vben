<script lang="ts" setup>
import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';
import type { HrmEmployeeConfigApi } from '#/api/hrm/employee/config';
import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';
import type { HrmEmployeeTrainingExperienceApi } from '#/api/hrm/employee/training-experience';
import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';
import type { HrmPortalEmployeeApi } from '#/api/hrm/portal/employee';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';

import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Empty,
  Spin,
  Table,
} from 'antdv-next';

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
const educationExperienceList = ref<
  HrmEmployeeEducationExperienceApi.EmployeeEducationExperience[]
>([]);
const workExperienceList = ref<
  HrmEmployeeWorkExperienceApi.EmployeeWorkExperience[]
>([]);
const certificateList = ref<HrmEmployeeCertificateApi.EmployeeCertificate[]>(
  [],
);
const trainingExperienceList = ref<
  HrmEmployeeTrainingExperienceApi.EmployeeTrainingExperience[]
>([]);
const contactList = ref<HrmEmployeeContactApi.EmployeeContact[]>([]);

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

const educationColumns = [
  { title: '学历', dataIndex: 'education', key: 'education', width: 110 },
  {
    title: '毕业院校',
    dataIndex: 'graduateSchool',
    key: 'graduateSchool',
    minWidth: 160,
  },
  { title: '专业', dataIndex: 'major', key: 'major', minWidth: 130 },
  {
    title: '入学日期',
    dataIndex: 'admissionTime',
    key: 'admissionTime',
    width: 120,
  },
  {
    title: '毕业日期',
    dataIndex: 'graduationTime',
    key: 'graduationTime',
    width: 120,
  },
];
const workColumns = [
  { title: '工作单位', dataIndex: 'workUnit', key: 'workUnit', minWidth: 170 },
  { title: '职务', dataIndex: 'postName', key: 'postName', minWidth: 130 },
  { title: '开始日期', dataIndex: 'startTime', key: 'startTime', width: 120 },
  { title: '结束日期', dataIndex: 'endTime', key: 'endTime', width: 120 },
  { title: '离职原因', dataIndex: 'reason', key: 'reason', minWidth: 180 },
];
const certificateColumns = [
  { title: '证书名称', dataIndex: 'name', key: 'name', minWidth: 160 },
  { title: '级别', dataIndex: 'level', key: 'level', width: 110 },
  { title: '证书编号', dataIndex: 'no', key: 'no', minWidth: 150 },
  {
    title: '发证机构',
    dataIndex: 'issuingAuthority',
    key: 'issuingAuthority',
    minWidth: 150,
  },
  {
    title: '发证日期',
    dataIndex: 'issuingTime',
    key: 'issuingTime',
    width: 120,
  },
];
const trainingColumns = [
  { title: '培训课程', dataIndex: 'course', key: 'course', minWidth: 150 },
  {
    title: '培训机构',
    dataIndex: 'organizationName',
    key: 'organizationName',
    minWidth: 150,
  },
  {
    title: '培训时间',
    dataIndex: 'trainingTime',
    key: 'trainingTime',
    minWidth: 230,
  },
  { title: '培训成绩', dataIndex: 'result', key: 'result', width: 110 },
  {
    title: '培训证书',
    dataIndex: 'certificateName',
    key: 'certificateName',
    minWidth: 150,
  },
];
const contactColumns = [
  { title: '联系人', dataIndex: 'name', key: 'name', width: 120 },
  { title: '关系', dataIndex: 'relation', key: 'relation', width: 100 },
  { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 140 },
  { title: '工作单位', dataIndex: 'workUnit', key: 'workUnit', minWidth: 150 },
  { title: '联系地址', dataIndex: 'address', key: 'address', minWidth: 180 },
];

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
    educationExperienceList.value = educationExperiences;
    workExperienceList.value = workExperiences;
    certificateList.value = certificates;
    trainingExperienceList.value = trainingExperiences;
    contactList.value = contacts;
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
            v-if="employee.sex != null"
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
            v-if="employee.highestEducation != null"
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
      <Table
        v-if="educationExperienceList.length"
        bordered
        :columns="educationColumns"
        :data-source="educationExperienceList"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'education'">
            <DictTag
              :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
              :value="record.education"
            />
          </template>
          <template v-else-if="column.key === 'admissionTime'">
            {{ formatHrmDate(record.admissionTime) }}
          </template>
          <template v-else-if="column.key === 'graduationTime'">
            {{ formatHrmDate(record.graduationTime) }}
          </template>
        </template>
      </Table>
      <Empty v-else description="暂无数据" />
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="工作经历">
      <Table
        v-if="workExperienceList.length"
        bordered
        :columns="workColumns"
        :data-source="workExperienceList"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'startTime'">
            {{ formatHrmDate(record.startTime) }}
          </template>
          <template v-else-if="column.key === 'endTime'">
            {{ formatHrmDate(record.endTime) }}
          </template>
        </template>
      </Table>
      <Empty v-else description="暂无数据" />
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="证书/证件">
      <Table
        v-if="certificateList.length"
        bordered
        :columns="certificateColumns"
        :data-source="certificateList"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'issuingTime'">
            {{ formatHrmDate(record.issuingTime) }}
          </template>
        </template>
      </Table>
      <Empty v-else description="暂无数据" />
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="培训经历">
      <Table
        v-if="trainingExperienceList.length"
        bordered
        :columns="trainingColumns"
        :data-source="trainingExperienceList"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'trainingTime'">
            {{ formatHrmDate(record.startTime) }} 至
            {{ formatHrmDate(record.endTime) }}
          </template>
        </template>
      </Table>
      <Empty v-else description="暂无数据" />
    </Card>

    <Card :style="{ marginBottom: '15px' }" title="联系人">
      <Table
        v-if="contactList.length"
        bordered
        :columns="contactColumns"
        :data-source="contactList"
        :pagination="false"
        row-key="id"
        size="small"
      />
      <Empty v-else description="暂无数据" />
    </Card>
  </Spin>
</template>
