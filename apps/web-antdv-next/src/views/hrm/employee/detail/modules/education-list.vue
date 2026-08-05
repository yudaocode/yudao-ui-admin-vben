<script lang="ts" setup>
import type { TableColumnsType } from 'antdv-next';

import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Button, message, Table } from 'antdv-next';

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
    message.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

const columns: TableColumnsType<HrmEmployeeEducationExperienceApi.EmployeeEducationExperience> =
  [
    { title: '学历', key: 'education', width: 100 },
    {
      title: '毕业院校',
      dataIndex: 'graduateSchool',
      key: 'graduateSchool',
    },
    { title: '专业', dataIndex: 'major', key: 'major' },
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
    {
      title: '教学方式',
      key: 'teachingMethods',
      width: 110,
    },
    {
      title: '第一学历',
      key: 'firstDegree',
      width: 100,
    },
    { title: '操作', key: 'action', width: 140, fixed: 'right' },
  ];

onMounted(() => getList());
defineExpose({ getList });
</script>

<template>
  <div>
    <div
      v-if="hasAccessByCodes(['hrm:employee:update'])"
      class="mb-3 flex justify-end"
    >
      <Button type="primary" @click="openForm()">新增</Button>
    </div>
    <Table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 1100 }"
      bordered
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'admissionTime'">
          {{ formatHrmDateTime(record.admissionTime) }}
        </template>
        <template v-else-if="column.key === 'graduationTime'">
          {{ formatHrmDateTime(record.graduationTime) }}
        </template>
        <template v-else-if="column.key === 'education'">
          <DictTag
            v-if="record.education != null"
            :type="DICT_TYPE.HRM_EMPLOYEE_EDUCATION"
            :value="record.education"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'teachingMethods'">
          {{ formatHrmEmployeeTeachingMethod(record.teachingMethods) }}
        </template>
        <template v-else-if="column.key === 'firstDegree'">
          <DictTag
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="record.firstDegree"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <Button
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            type="link"
            @click="openForm(record)"
          >
            编辑
          </Button>
          <Button
            v-if="hasAccessByCodes(['hrm:employee:delete'])"
            danger
            type="link"
            @click="handleDelete(record.id)"
          >
            删除
          </Button>
        </template>
      </template>
    </Table>
    <Form ref="formRef" @success="getList" />
  </div>
</template>
