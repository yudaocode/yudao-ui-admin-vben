<script lang="ts" setup>
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeEducationExperience,
  getEmployeeEducationExperienceList,
} from '#/api/hrm/employee/education-experience';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import {
  formatHrmDateTime,
  formatHrmEmployeeTeachingMethod,
} from '#/views/hrm/utils/format';

import Form from './education-form.vue';

defineOptions({ name: 'HrmEmployeeEducationList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<
  HrmEmployeeEducationExperienceApi.EmployeeEducationExperience[]
>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeEducationExperienceList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(
  row?: HrmEmployeeEducationExperienceApi.EmployeeEducationExperience,
) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeEducationExperience(id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

onMounted(() => getList());
defineExpose({ getList });
</script>

<template>
  <div>
    <div
      v-if="hasAccessByCodes(['hrm:employee:update'])"
      class="mb-3 flex justify-end"
    >
      <ElButton type="primary" @click="openForm()">新增</ElButton>
    </div>
    <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
      <ElTableColumn label="学历" min-width="100">
        <template #default="{ row }">
          <DictTag
            v-if="row.education != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="row.education"
          />
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="毕业院校" min-width="150" prop="graduateSchool" />
      <ElTableColumn label="专业" min-width="120" prop="major" />
      <ElTableColumn label="入学日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.admissionTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="毕业日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.graduationTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="教学方式" min-width="110">
        <template #default="{ row }">
          {{ formatHrmEmployeeTeachingMethod(row.teachingMethods) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="第一学历" min-width="100">
        <template #default="{ row }">
          <DictTag
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="row.firstDegree"
          />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" fixed="right" label="操作" width="140">
        <template #default="{ row }">
          <ElButton
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            link
            type="primary"
            @click="openForm(row)"
          >
            编辑
          </ElButton>
          <ElButton
            v-if="hasAccessByCodes(['hrm:employee:delete'])"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <Form ref="formRef" @success="getList" />
  </div>
</template>
