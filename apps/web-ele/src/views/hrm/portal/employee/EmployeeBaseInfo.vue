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
  ElAlert,
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElTable,
  ElTableColumn,
} from 'element-plus';

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
  <div v-loading="loading">
    <ElAlert
      :style="{ marginBottom: '15px' }"
      :closable="false"
      show-icon
      :title="employeeReminder"
      type="info"
    />

    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-semibold">基本信息</span>
          <ElButton
            v-if="
              hasEditableFields &&
              hasAccessByCodes(['hrm:portal:employee:update'])
            "
            link
            type="primary"
            @click="emit('edit')"
          >
            编辑
          </ElButton>
        </div>
      </template>
      <ElDescriptions border :column="4" size="small">
        <ElDescriptionsItem v-if="isVisible('name')" label="姓名">
          {{ employee.name || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('sex')" label="性别">
          <DictTag
            v-if="employee.sex != null"
            :type="DICT_TYPE.SYSTEM_USER_SEX"
            :value="employee.sex"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('birthday')" label="出生时间">
          {{ formatHrmDateTime(employee.birthday) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('age')" label="年龄">
          {{ employee.age ?? '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('country')" label="国家或地区">
          {{ employee.country || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('nation')" label="民族">
          {{ employee.nation || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('nativePlace')" label="籍贯">
          {{ employee.nativePlace || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-if="isVisible('highestEducation')"
          label="最高学历"
        >
          <DictTag
            v-if="employee.highestEducation != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="employee.highestEducation"
          />
          <span v-else>-</span>
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('idType')" label="证件类型">
          {{ formatHrmEmployeeIdType(employee.idType) }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('idNumber')" label="证件号码">
          {{ employee.idNumber || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <ElCard
      v-if="hasVisibleContactFields"
      shadow="never"
      :style="{ marginBottom: '15px' }"
    >
      <template #header>
        <span class="font-semibold">通讯信息</span>
      </template>
      <ElDescriptions border :column="4" size="small">
        <ElDescriptionsItem v-if="isVisible('mobile')" label="手机号">
          {{ employee.mobile || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="isVisible('email')" label="邮箱">
          {{ employee.email || '-' }}
        </ElDescriptionsItem>
        <ElDescriptionsItem
          v-if="isVisible('address')"
          label="户籍地址"
          :span="4"
        >
          {{ employee.address || '-' }}
        </ElDescriptionsItem>
      </ElDescriptions>
    </ElCard>

    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">教育经历</span>
      </template>
      <ElTable
        v-if="educationExperienceList.length"
        border
        :data="educationExperienceList"
        row-key="id"
        size="small"
      >
        <ElTableColumn label="学历" prop="education" width="110">
          <template #default="{ row }">
            <DictTag
              :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
              :value="row.education"
            />
          </template>
        </ElTableColumn>
        <ElTableColumn label="毕业院校" min-width="160" prop="graduateSchool" />
        <ElTableColumn label="专业" min-width="130" prop="major" />
        <ElTableColumn label="入学日期" prop="admissionTime" width="120">
          <template #default="{ row }">
            {{ formatHrmDate(row.admissionTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="毕业日期" prop="graduationTime" width="120">
          <template #default="{ row }">
            {{ formatHrmDate(row.graduationTime) }}
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="暂无数据" />
    </ElCard>

    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">工作经历</span>
      </template>
      <ElTable
        v-if="workExperienceList.length"
        border
        :data="workExperienceList"
        row-key="id"
        size="small"
      >
        <ElTableColumn label="工作单位" min-width="170" prop="workUnit" />
        <ElTableColumn label="职务" min-width="130" prop="postName" />
        <ElTableColumn label="开始日期" prop="startTime" width="120">
          <template #default="{ row }">
            {{ formatHrmDate(row.startTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="结束日期" prop="endTime" width="120">
          <template #default="{ row }">
            {{ formatHrmDate(row.endTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="离职原因" min-width="180" prop="reason" />
      </ElTable>
      <ElEmpty v-else description="暂无数据" />
    </ElCard>

    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">证书/证件</span>
      </template>
      <ElTable
        v-if="certificateList.length"
        border
        :data="certificateList"
        row-key="id"
        size="small"
      >
        <ElTableColumn label="证书名称" min-width="160" prop="name" />
        <ElTableColumn label="级别" prop="level" width="110" />
        <ElTableColumn label="证书编号" min-width="150" prop="no" />
        <ElTableColumn
          label="发证机构"
          min-width="150"
          prop="issuingAuthority"
        />
        <ElTableColumn label="发证日期" prop="issuingTime" width="120">
          <template #default="{ row }">
            {{ formatHrmDate(row.issuingTime) }}
          </template>
        </ElTableColumn>
      </ElTable>
      <ElEmpty v-else description="暂无数据" />
    </ElCard>

    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">培训经历</span>
      </template>
      <ElTable
        v-if="trainingExperienceList.length"
        border
        :data="trainingExperienceList"
        row-key="id"
        size="small"
      >
        <ElTableColumn label="培训课程" min-width="150" prop="course" />
        <ElTableColumn
          label="培训机构"
          min-width="150"
          prop="organizationName"
        />
        <ElTableColumn label="培训时间" min-width="230">
          <template #default="{ row }">
            {{ formatHrmDate(row.startTime) }} 至
            {{ formatHrmDate(row.endTime) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="培训成绩" prop="result" width="110" />
        <ElTableColumn
          label="培训证书"
          min-width="150"
          prop="certificateName"
        />
      </ElTable>
      <ElEmpty v-else description="暂无数据" />
    </ElCard>

    <ElCard shadow="never" :style="{ marginBottom: '15px' }">
      <template #header>
        <span class="font-semibold">联系人</span>
      </template>
      <ElTable
        v-if="contactList.length"
        border
        :data="contactList"
        row-key="id"
        size="small"
      >
        <ElTableColumn label="联系人" prop="name" width="120" />
        <ElTableColumn label="关系" prop="relation" width="100" />
        <ElTableColumn label="联系电话" prop="phone" width="140" />
        <ElTableColumn label="工作单位" min-width="150" prop="workUnit" />
        <ElTableColumn label="联系地址" min-width="180" prop="address" />
      </ElTable>
      <ElEmpty v-else description="暂无数据" />
    </ElCard>
  </div>
</template>
