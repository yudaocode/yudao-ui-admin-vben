<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteApi } from '#/api/mes/pro/route';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message, Modal, Switch, Tooltip } from 'ant-design-vue';

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

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建工艺路线 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑工艺路线（仅停用状态可编辑） */
function handleEdit(row: MesProRouteApi.Route) {
  formModalApi.setData({ id: row.id, type: 'update' }).open();
}

/** 详情查看 */
function handleDetail(row: MesProRouteApi.Route) {
  formModalApi.setData({ id: row.id, type: 'detail' }).open();
}

/** 切换状态 */
async function handleStatusChange(row: MesProRouteApi.Route, value: number) {
  const text = value === CommonStatusEnum.ENABLE ? '启用' : '停用';
  const previousStatus = row.status;
  Modal.confirm({
    title: `确认要"${text}""${row.name}"工艺路线吗？`,
    onOk: async () => {
      await updateRouteStatus(row.id!, value);
      message.success($t('ui.actionMessage.operationSuccess'));
      handleRefresh();
    },
    onCancel: () => {
      // 用户取消时回滚开关状态
      row.status = previousStatus;
    },
  });
}

/** 删除（仅停用状态可删除） */
async function handleDelete(row: MesProRouteApi.Route) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteRoute(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出 */
async function handleExport() {
  const data = await exportRoute(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '工艺路线.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
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
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
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
        <Button type="link" @click="handleDetail(row)">{{ row.code }}</Button>
      </template>
      <template #status="{ row }">
        <Switch
          :checked="row.status === CommonStatusEnum.ENABLE"
          checked-children="启用"
          un-checked-children="停用"
          @change="
            (checked: boolean | number | string) =>
              handleStatusChange(
                row,
                checked ? CommonStatusEnum.ENABLE : CommonStatusEnum.DISABLE,
              )
          "
        />
      </template>
      <template #actions="{ row }">
        <Tooltip
          :open="row.status === CommonStatusEnum.DISABLE ? false : undefined"
          title="仅停用状态，才可以操作"
        >
          <span class="inline-block">
            <TableAction
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'link',
                  icon: ACTION_ICON.EDIT,
                  auth: ['mes:pro-route:update'],
                  disabled: row.status !== CommonStatusEnum.DISABLE,
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'link',
                  danger: true,
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
        </Tooltip>
      </template>
    </Grid>
  </Page>
</template>
