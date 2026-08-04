<script lang="ts" setup>
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { ElCard, ElMessage, ElTable, ElTableColumn } from 'element-plus';

import { ACTION_ICON, TableAction } from '#/adapter/vxe-table';
import {
  cancelSalaryChangeRecord,
  deleteSalaryChangeRecord,
  getSalaryChangeRecordList,
} from '#/api/hrm/salary/change-record';
import { DictTag } from '#/components/dict-tag';
import { $t } from '#/locales';
import {
  HrmSalaryChangeRecordStatus,
  HrmSalaryRecordType,
} from '#/views/hrm/utils/constants';
import { formatHrmDate, formatHrmMoney } from '#/views/hrm/utils/format';

defineOptions({ name: 'HrmSalaryChangeRecordList' });

const props = defineProps<{ employeeId: number }>();

const emit = defineEmits<{
  change: [];
  edit: [record: HrmSalaryChangeRecordApi.SalaryChangeRecord];
}>();

const loading = ref(false);
const recordList = ref<HrmSalaryChangeRecordApi.SalaryChangeRecord[]>([]);

async function getList() {
  loading.value = true;
  try {
    recordList.value = await getSalaryChangeRecordList(props.employeeId);
  } finally {
    loading.value = false;
  }
}

function canEditRecord(record: HrmSalaryChangeRecordApi.SalaryChangeRecord) {
  if (record.recordType !== HrmSalaryRecordType.FIXED) {
    return record.status !== HrmSalaryChangeRecordStatus.EFFECTIVE;
  }
  return !recordList.value.some(
    (item) =>
      item.recordType === HrmSalaryRecordType.CHANGE &&
      item.status !== HrmSalaryChangeRecordStatus.CANCELLED,
  );
}

async function handleCancel(recordId?: number) {
  if (!recordId) {
    return;
  }
  try {
    await confirm('确认取消该待生效的薪资调整吗？');
    await cancelSalaryChangeRecord(recordId);
    ElMessage.success($t('ui.actionMessage.updateSuccess'));
    await getList();
    emit('change');
  } catch {}
}

async function handleDelete(recordId?: number) {
  if (!recordId) {
    return;
  }
  try {
    await confirm($t('ui.actionMessage.deleteConfirm'));
    await deleteSalaryChangeRecord(recordId);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
    await getList();
    emit('change');
  } catch {}
}

onMounted(() => {
  getList();
});

defineExpose({ getList });
</script>

<template>
  <ElCard>
    <ElTable v-loading="loading" border :data="recordList" size="small">
      <ElTableColumn align="center" label="类型" width="90">
        <template #default="{ row }">
          {{ row.recordType === HrmSalaryRecordType.FIXED ? '定薪' : '调薪' }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="调整原因" width="120">
        <template #default="{ row }">
          <DictTag
            v-if="row.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="row.changeReason"
          />
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="生效日期" width="120">
        <template #default="{ row }">
          {{ formatHrmDate(row.effectTime) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="正式调整前" width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.beforeTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="正式调整后" width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.afterTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="试用调整前" width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.probationBeforeTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="right" label="试用调整后" width="120">
        <template #default="{ row }">
          {{ formatHrmMoney(row.probationAfterTotal) }}
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="状态" width="110">
        <template #default="{ row }">
          <DictTag
            v-if="row.status != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS"
            :value="row.status"
          />
          <span v-else>-</span>
        </template>
      </ElTableColumn>
      <ElTableColumn label="备注" min-width="160" prop="remark" />
      <ElTableColumn align="center" fixed="right" label="操作" width="180">
        <template #default="{ row }">
          <TableAction
            :actions="[
              {
                label: '编辑',
                type: 'primary',
                link: true,
                icon: ACTION_ICON.EDIT,
                auth: ['hrm:salary:employee-info:update'],
                ifShow: canEditRecord(row),
                onClick: () => emit('edit', row),
              },
              {
                label: '取消',
                type: 'warning',
                link: true,
                icon: ACTION_ICON.CLOSE,
                auth: ['hrm:salary:employee-info:update'],
                ifShow: row.status === HrmSalaryChangeRecordStatus.PENDING,
                onClick: () => handleCancel(row.id),
              },
              {
                label: $t('common.delete'),
                type: 'danger',
                link: true,
                icon: ACTION_ICON.DELETE,
                auth: ['hrm:salary:change-record:delete'],
                ifShow: row.status !== HrmSalaryChangeRecordStatus.EFFECTIVE,
                onClick: () => handleDelete(row.id),
              },
            ]"
          />
        </template>
      </ElTableColumn>
    </ElTable>
  </ElCard>
</template>
