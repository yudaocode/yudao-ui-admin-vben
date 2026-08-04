<script lang="ts" setup>
import type { HrmEmployeeTrainingExperienceApi } from '#/api/hrm/employee/training-experience';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElLoading,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  deleteEmployeeTrainingExperience,
  getEmployeeTrainingExperienceList,
} from '#/api/hrm/employee/training-experience';
import { $t } from '#/locales';

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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting'),
  });
  try {
    await deleteEmployeeTrainingExperience(id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } finally {
    loadingInstance.close();
  }
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
      <ElTableColumn label="培训名称" min-width="140" prop="name" />
      <ElTableColumn label="培训机构" min-width="140" prop="organization" />
      <ElTableColumn align="center" label="操作" width="140">
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
