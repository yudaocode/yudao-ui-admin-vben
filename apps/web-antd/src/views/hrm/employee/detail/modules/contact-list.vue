<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeContactApi } from '#/api/hrm/employee/contact';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEmployeeContact,
  getEmployeeContactList,
} from '#/api/hrm/employee/contact';
import { $t } from '#/locales';

import { useContactGridColumns } from '../data';
import Form from './contact-form.vue';

defineOptions({ name: 'HrmEmployeeContactList' });

const props = defineProps<{ employeeId: number }>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function openForm(row?: HrmEmployeeContactApi.EmployeeContact) {
  formModalApi.setData({ employeeId: props.employeeId, row }).open();
}

async function handleDelete(row: HrmEmployeeContactApi.EmployeeContact) {
  if (!row.id) return;
  await deleteEmployeeContact(row.id);
  message.success($t('ui.actionMessage.deleteSuccess'));
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useContactGridColumns(),
    minHeight: 200,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getEmployeeContactList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmEmployeeContactApi.EmployeeContact>,
});
</script>

<template>
  <div class="w-full">
    <Grid table-title="联系人列表">
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
