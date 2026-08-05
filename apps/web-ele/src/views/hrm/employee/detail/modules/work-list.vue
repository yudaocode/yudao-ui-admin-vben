<script lang="ts" setup>
import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeWorkExperience,
  getEmployeeWorkExperienceList,
} from '#/api/hrm/employee/work-experience';
import { $t } from '#/locales';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import Form from './work-form.vue';

defineOptions({ name: 'HrmEmployeeWorkList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeWorkExperienceApi.EmployeeWorkExperience[]>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeWorkExperienceList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: HrmEmployeeWorkExperienceApi.EmployeeWorkExperience) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeWorkExperience(id);
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
      <ElTableColumn label="工作单位" min-width="120" prop="workUnit" />
      <ElTableColumn label="职务" min-width="120" prop="postName" />
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
      <ElTableColumn label="离职原因" min-width="120" prop="reason" />
      <ElTableColumn label="证明人" min-width="100" prop="witnessName" />
      <ElTableColumn label="证明人电话" min-width="120" prop="witnessPhone" />
      <ElTableColumn label="工作备注" min-width="140" prop="remark" />
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
