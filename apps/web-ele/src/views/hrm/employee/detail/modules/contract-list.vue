<script lang="ts" setup>
import type { HrmEmployeeContractApi } from '#/api/hrm/employee/contract';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getFileNameFromUrl, openWindow } from '@vben/utils';

import { ElButton, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import {
  deleteEmployeeContract,
  getEmployeeContractList,
} from '#/api/hrm/employee/contract';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import {
  formatHrmDateTime,
  formatHrmEmployeeContractStatus,
  formatHrmEmployeeContractType,
} from '#/views/hrm/utils/format';

import ContractForm from './contract-form.vue';

const props = defineProps<{ employeeId: number }>();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const list = ref<HrmEmployeeContractApi.EmployeeContract[]>([]);
const formRef = ref<InstanceType<typeof ContractForm>>();

async function getList() {
  loading.value = true;
  try {
    list.value = await getEmployeeContractList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

async function handleDelete(id?: number) {
  if (!id) return;
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteEmployeeContract(id);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
  } catch {}
}

onMounted(getList);
</script>

<template>
  <div>
    <div
      v-if="hasAccessByCodes(['hrm:employee:update'])"
      class="mb-3 flex justify-end"
    >
      <ElButton type="primary" @click="formRef?.open(employeeId)">
        新增
      </ElButton>
    </div>
    <ElTable v-loading="loading" :data="list" border row-key="id" size="small">
      <ElTableColumn label="合同编号" min-width="150" prop="no" />
      <ElTableColumn label="合同类型" min-width="110">
        <template #default="{ row }">
          {{ formatHrmEmployeeContractType(row.type) }}
        </template>
      </ElTableColumn>
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
      <ElTableColumn label="期限" min-width="90">
        <template #default="{ row }">
          {{ row.term != null ? `${row.term} 年` : '-' }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="合同状态" min-width="110">
        <template #default="{ row }">
          {{ formatHrmEmployeeContractStatus(row.status) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="签约公司" min-width="150" prop="signCompany" />
      <ElTableColumn label="签订日期" min-width="120">
        <template #default="{ row }">
          {{ formatHrmDateTime(row.signTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn label="到期提醒" min-width="100">
        <template #default="{ row }">
          <DictTag
            v-if="row.expireRemind != null"
            :type="DICT_TYPE.INFRA_BOOLEAN_STRING"
            :value="row.expireRemind"
          />
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="160" prop="remark" />
      <ElTableColumn label="附件" min-width="180">
        <template #default="{ row }">
          <div v-if="row.fileUrls?.length" class="flex flex-col items-start">
            <ElButton
              v-for="url in row.fileUrls"
              :key="url"
              class="!h-auto !px-0"
              link
              type="primary"
              @click="openWindow(url)"
            >
              {{ getFileNameFromUrl(url) }}
            </ElButton>
          </div>
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" fixed="right" label="操作" width="140">
        <template #default="{ row }">
          <ElButton
            v-if="hasAccessByCodes(['hrm:employee:update'])"
            link
            type="primary"
            @click="formRef?.open(employeeId, row)"
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
    <ContractForm ref="formRef" @success="getList" />
  </div>
</template>
