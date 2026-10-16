<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeWorkExperienceApi } from '#/api/hrm/employee/work-experience';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEmployeeWorkExperience,
  getEmployeeWorkExperienceList,
} from '#/api/hrm/employee/work-experience';
import { $t } from '#/locales';

import { useWorkGridColumns } from '../data';
import Form from './work-form.vue';

defineOptions({ name: 'HrmEmployeeWorkList' });

const props = defineProps<{ employeeId: number }>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function openForm(row?: HrmEmployeeWorkExperienceApi.EmployeeWorkExperience) {
  formModalApi.setData({ employeeId: props.employeeId, row }).open();
}

async function handleDelete(
  row: HrmEmployeeWorkExperienceApi.EmployeeWorkExperience,
) {
  if (!row.id) return;
  await deleteEmployeeWorkExperience(row.id);
  message.success($t('ui.actionMessage.deleteSuccess'));
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useWorkGridColumns(),
    minHeight: 200,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getEmployeeWorkExperienceList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmEmployeeWorkExperienceApi.EmployeeWorkExperience>,
});
</script>

<template>
  <div class="w-full">
    <Grid table-title="工作经历列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:employee:update'],
              onClick: () => openForm(),
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['hrm:employee:update'],
              onClick: () => openForm(row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:employee:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm'),
                confirm: () => handleDelete(row),
              },
            },
          ]"
        />
      </template>
    </Grid>
    <FormModal @success="gridApi.query" />
  </div>
</template>
