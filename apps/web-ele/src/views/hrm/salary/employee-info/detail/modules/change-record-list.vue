<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { ElCard, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelSalaryChangeRecord,
  deleteSalaryChangeRecord,
  getSalaryChangeRecordList,
} from '#/api/hrm/salary/change-record';
import { $t } from '#/locales';
import {
  HrmSalaryChangeRecordStatus,
  HrmSalaryRecordType,
} from '#/views/hrm/utils/constants';

import { useChangeRecordGridColumns } from '../../data';

defineOptions({ name: 'HrmSalaryChangeRecordList' });

const props = defineProps<{ employeeId: number }>();
const emit = defineEmits<{
  change: [];
  edit: [record: HrmSalaryChangeRecordApi.SalaryChangeRecord];
}>();
const recordList = ref<HrmSalaryChangeRecordApi.SalaryChangeRecord[]>([]);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    border: true,
    columns: useChangeRecordGridColumns(),
    data: [],
    minHeight: 240,
    pagerConfig: { enabled: false },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { enabled: false },
  } as VxeTableGridOptions<HrmSalaryChangeRecordApi.SalaryChangeRecord>,
});

async function getList() {
  gridApi.setLoading(true);
  try {
    recordList.value = await getSalaryChangeRecordList(props.employeeId);
    await gridApi.grid.reloadData(recordList.value);
  } finally {
    gridApi.setLoading(false);
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
  if (!recordId) return;
  await cancelSalaryChangeRecord(recordId);
  ElMessage.success($t('ui.actionMessage.updateSuccess'));
  await getList();
  emit('change');
}

async function handleDelete(recordId?: number) {
  if (!recordId) return;
  await deleteSalaryChangeRecord(recordId);
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  await getList();
  emit('change');
}

onMounted(getList);
defineExpose({ getList });
</script>

<template>
  <ElCard>
    <Grid class="w-full">
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:salary:employee-info:update'],
              ifShow: canEditRecord(row),
              onClick: () => emit('edit', row),
            },
            {
              label: '取消',
              icon: ACTION_ICON.CLOSE,
              auth: ['hrm:salary:employee-info:update'],
              ifShow: row.status === HrmSalaryChangeRecordStatus.PENDING,
              popConfirm: {
                title: '确认取消该待生效的薪资调整吗？',
                confirm: handleCancel.bind(null, row.id),
              },
            },
            {
              label: $t('common.delete'),
              color: 'error',
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:salary:change-record:delete'],
              ifShow: row.status !== HrmSalaryChangeRecordStatus.EFFECTIVE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm'),
                confirm: handleDelete.bind(null, row.id),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </ElCard>
</template>
