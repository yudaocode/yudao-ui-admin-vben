<script lang="ts" setup>
import type { HrmEmployeeEducationExperienceApi } from '#/api/hrm/employee/education-experience';

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
  deleteEmployeeEducationExperience,
  getEmployeeEducationExperienceList,
} from '#/api/hrm/employee/education-experience';
import { $t } from '#/locales';

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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting'),
  });
  try {
    await deleteEmployeeEducationExperience(id);
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
      <ElTableColumn label="学校" min-width="120" prop="school" />
      <ElTableColumn label="专业" min-width="120" prop="major" />
      <ElTableColumn label="学历" min-width="100" prop="education" />
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
