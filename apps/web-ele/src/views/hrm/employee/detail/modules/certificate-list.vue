<script lang="ts" setup>
import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeCertificate,
  getEmployeeCertificateList,
} from '#/api/hrm/employee/certificate';
import { $t } from '#/locales';
import { formatHrmDateTime } from '#/views/hrm/utils/format';

import Form from './certificate-form.vue';

defineOptions({ name: 'HrmEmployeeCertificateList' });

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();

const loading = ref(false);
const list = ref<HrmEmployeeCertificateApi.EmployeeCertificate[]>([]);
const formRef = ref<InstanceType<typeof Form>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeCertificateList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function openForm(row?: HrmEmployeeCertificateApi.EmployeeCertificate) {
  formRef.value?.open(props.employeeId, row);
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeCertificate(id);
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
      <ElTableColumn label="证书名称" min-width="120" prop="name" />
      <ElTableColumn label="证书级别" min-width="100" prop="level" />
      <ElTableColumn label="证书编号" min-width="120" prop="no" />
      <ElTableColumn label="有效开始日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.startTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="有效结束日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.endTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="发证机构" min-width="140" prop="issuingAuthority" />
      <ElTableColumn label="发证日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.issuingTime) }}
        </template>
      </ElTableColumn>
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
