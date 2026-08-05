<script lang="ts" setup>
import type { HrmEmployeeTrainingExperienceApi } from '#/api/hrm/employee/training-experience';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeTrainingExperience,
  getEmployeeTrainingExperienceList,
} from '#/api/hrm/employee/training-experience';
import { $t } from '#/locales';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import Form from './training-form.vue';

defineOptions({ name: 'HrmEmployeeTrainingList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeTrainingExperienceApi.EmployeeTrainingExperience[]>(
  [],
);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeTrainingExperienceList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(
  row?: HrmEmployeeTrainingExperienceApi.EmployeeTrainingExperience,
) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeTrainingExperience(id);
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
      <ElTableColumn label="培训课程" min-width="140" prop="course" />
      <ElTableColumn label="培训机构" min-width="140" prop="organizationName" />
      <ElTableColumn label="开始日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.startTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="结束日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.endTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="培训时长" min-width="100" prop="duration" />
      <ElTableColumn label="培训成绩" min-width="100" prop="result" />
      <ElTableColumn label="证书名称" min-width="120" prop="certificateName" />
      <ElTableColumn label="备注" min-width="140" prop="remark" />
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
