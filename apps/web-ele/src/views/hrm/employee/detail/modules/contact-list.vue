<script lang="ts" setup>
import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeContact,
  getEmployeeContactList,
} from '#/api/hrm/employee/contact';
import { $t } from '#/locales';

import Form from './contact-form.vue';

defineOptions({ name: 'HrmEmployeeContactList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeContactApi.EmployeeContact[]>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeContactList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: HrmEmployeeContactApi.EmployeeContact) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeContact(id);
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
      <ElTableColumn label="联系人" min-width="100" prop="name" />
      <ElTableColumn label="关系" min-width="80" prop="relation" />
      <ElTableColumn label="电话" min-width="120" prop="phone" />
      <ElTableColumn label="工作单位" min-width="120" prop="workUnit" />
      <ElTableColumn label="职务" min-width="100" prop="postName" />
      <ElTableColumn label="地址" min-width="140" prop="address" />
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
