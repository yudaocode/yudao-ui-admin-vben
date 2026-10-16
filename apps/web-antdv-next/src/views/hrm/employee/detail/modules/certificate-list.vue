<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmEmployeeCertificateApi } from '#/api/hrm/employee/certificate';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEmployeeCertificate,
  getEmployeeCertificateList,
} from '#/api/hrm/employee/certificate';
import { $t } from '#/locales';

import { useCertificateGridColumns } from '../data';
import Form from './certificate-form.vue';

defineOptions({ name: 'HrmEmployeeCertificateList' });

const props = defineProps<{ employeeId: number }>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function openForm(row?: HrmEmployeeCertificateApi.EmployeeCertificate) {
  formModalApi.setData({ employeeId: props.employeeId, row }).open();
}

async function handleDelete(
  row: HrmEmployeeCertificateApi.EmployeeCertificate,
) {
  if (!row.id) return;
  await deleteEmployeeCertificate(row.id);
  message.success($t('ui.actionMessage.deleteSuccess'));
  await gridApi.query();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCertificateGridColumns(),
    minHeight: 200,
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: () => getEmployeeCertificateList(props.employeeId),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmEmployeeCertificateApi.EmployeeCertificate>,
});
</script>

<template>
  <div class="w-full">
    <Grid table-title="证书列表">
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
