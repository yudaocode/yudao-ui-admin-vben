<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmInsuranceSchemeApi } from '#/api/hrm/insurance/scheme';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteInsuranceScheme,
  getInsuranceSchemeList,
} from '#/api/hrm/insurance/scheme';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmInsuranceScheme' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function handleRefresh() {
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function handleEdit(row: HrmInsuranceSchemeApi.InsuranceScheme) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

async function handleDelete(row: HrmInsuranceSchemeApi.InsuranceScheme) {
  await confirm(`确认删除参保方案"${row.name}"吗？`);
  await deleteInsuranceScheme(row.id!);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getInsuranceSchemeList();
          return { list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmInsuranceSchemeApi.InsuranceScheme>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【社保】社保管理"
        url="https://doc.iocoder.cn/hrm/insurance/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新建参保方案',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:insurance:scheme:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['hrm:insurance:scheme:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['hrm:insurance:scheme:delete'],
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
