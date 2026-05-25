<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteApi } from '#/api/mes/pro/route';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import {
  ElButton,
  ElLoading,
  ElMessage,
  ElMessageBox,
  ElSwitch,
  ElTooltip,
} from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRoute,
  exportRoute,
  getRoutePage,
  updateRouteStatus,
} from '#/api/mes/pro/route';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

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

function handleEdit(row: MesProRouteApi.Route) {
  formModalApi.setData({ id: row.id, type: 'update' }).open();
}

function handleDetail(row: MesProRouteApi.Route) {
  formModalApi.setData({ id: row.id, type: 'detail' }).open();
}

async function handleStatusChange(row: MesProRouteApi.Route, value: number) {
  const text = value === CommonStatusEnum.ENABLE ? '启用' : '停用';
  const previousStatus = row.status;
  try {
    await ElMessageBox.confirm(
      `确认要"${text}""${row.name}"工艺路线吗？`,
      '提示',
      { type: 'warning' },
    );
    await updateRouteStatus(row.id!, value);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    handleRefresh();
  } catch {
    row.status = previousStatus;
  }
}

async function handleDelete(row: MesProRouteApi.Route) {
  const hideLoading = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteRoute(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

async function handleExport() {
  const data = await exportRoute(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '工艺路线.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRoutePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { isHover: true, keyField: 'id' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<MesProRouteApi.Route>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】工序设置、工艺流程"
        url="https://doc.iocoder.cn/mes/pro/process-route/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="工艺路线列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['工艺路线']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:pro-route:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:pro-route:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <ElButton link type="primary" @click="handleDetail(row)">
          {{ row.code }}
        </ElButton>
      </template>
      <template #status="{ row }">
        <ElSwitch
          :model-value="row.status === CommonStatusEnum.ENABLE"
          active-text="启用"
          inactive-text="停用"
          @update:model-value="
            (value: boolean | number | string) =>
              handleStatusChange(
                row,
                value ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE,
              )
          "
        />
      </template>
      <template #actions="{ row }">
        <ElTooltip
          :disabled="row.status === CommonStatusEnum.DISABLE"
          content="仅停用状态，才可以操作"
          placement="top"
        >
          <span class="inline-block">
            <TableAction
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'primary',
                  link: true,
                  icon: ACTION_ICON.EDIT,
                  auth: ['mes:pro-route:update'],
                  disabled: row.status !== CommonStatusEnum.DISABLE,
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['mes:pro-route:delete'],
                  disabled: row.status !== CommonStatusEnum.DISABLE,
                  popConfirm: {
                    title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
          </span>
        </ElTooltip>
      </template>
    </Grid>
  </Page>
</template>
