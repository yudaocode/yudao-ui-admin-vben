<script lang="ts" setup>
import type { HrmSalaryChangeRecordApi } from '#/api/hrm/salary/change-record';

import { onMounted, ref } from 'vue';

import { confirm } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';

import { Card, message, Table } from 'antdv-next';

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
    message.success($t('ui.actionMessage.updateSuccess'));
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
    message.success($t('ui.actionMessage.deleteSuccess'));
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
  <Card>
    <Table
      bordered
      size="small"
      :columns="[
        {
          title: '类型',
          key: 'recordType',
          align: 'center',
          width: 90,
        },
        {
          title: '调整原因',
          key: 'changeReason',
          align: 'center',
          width: 120,
        },
        {
          title: '生效日期',
          dataIndex: 'effectTime',
          key: 'effectTime',
          align: 'center',
          width: 120,
        },
        {
          title: '正式调整前',
          key: 'beforeTotal',
          align: 'right',
          width: 120,
        },
        {
          title: '正式调整后',
          key: 'afterTotal',
          align: 'right',
          width: 120,
        },
        {
          title: '试用调整前',
          key: 'probationBeforeTotal',
          align: 'right',
          width: 120,
        },
        {
          title: '试用调整后',
          key: 'probationAfterTotal',
          align: 'right',
          width: 120,
        },
        {
          title: '状态',
          key: 'status',
          align: 'center',
          width: 110,
        },
        {
          title: '备注',
          dataIndex: 'remark',
          key: 'remark',
          ellipsis: true,
        },
        {
          title: '操作',
          key: 'actions',
          align: 'center',
          fixed: 'right',
          width: 180,
        },
      ]"
      :data-source="recordList"
      :loading="loading"
      :pagination="false"
      :row-key="(row) => row.id ?? 0"
      :scroll="{ x: 1200 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'recordType'">
          {{
            record.recordType === HrmSalaryRecordType.FIXED ? '定薪' : '调薪'
          }}
        </template>
        <template v-else-if="column.key === 'changeReason'">
          <DictTag
            v-if="record.changeReason != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_REASON"
            :value="record.changeReason"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'effectTime'">
          {{ formatHrmDate(record.effectTime) }}
        </template>
        <template v-else-if="column.key === 'beforeTotal'">
          {{ formatHrmMoney(record.beforeTotal) }}
        </template>
        <template v-else-if="column.key === 'afterTotal'">
          {{ formatHrmMoney(record.afterTotal) }}
        </template>
        <template v-else-if="column.key === 'probationBeforeTotal'">
          {{ formatHrmMoney(record.probationBeforeTotal) }}
        </template>
        <template v-else-if="column.key === 'probationAfterTotal'">
          {{ formatHrmMoney(record.probationAfterTotal) }}
        </template>
        <template v-else-if="column.key === 'status'">
          <DictTag
            v-if="record.status != null"
            :type="DICT_TYPE.HRM_SALARY_CHANGE_RECORD_STATUS"
            :value="record.status"
          />
          <span v-else>-</span>
        </template>
        <template v-else-if="column.key === 'actions'">
          <TableAction
            :actions="[
              {
                label: '编辑',
                type: 'link',
                icon: ACTION_ICON.EDIT,
                auth: ['hrm:salary:employee-info:update'],
                ifShow: canEditRecord(record),
                onClick: () => emit('edit', record),
              },
              {
                label: '取消',
                type: 'link',
                icon: ACTION_ICON.CLOSE,
                auth: ['hrm:salary:employee-info:update'],
                ifShow: record.status === HrmSalaryChangeRecordStatus.PENDING,
                onClick: () => handleCancel(record.id),
              },
              {
                label: $t('common.delete'),
                type: 'link',
                danger: true,
                icon: ACTION_ICON.DELETE,
                auth: ['hrm:salary:change-record:delete'],
                ifShow: record.status !== HrmSalaryChangeRecordStatus.EFFECTIVE,
                onClick: () => handleDelete(record.id),
              },
            ]"
          />
        </template>
      </template>
    </Table>
  </Card>
</template>
