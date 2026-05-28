<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProRouteApi } from '#/api/mes/pro/route';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { CommonStatusEnum, DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage, ElTooltip } from 'element-plus';

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

const { hasAccessByCodes } = useAccess();
const statusEditable = hasAccessByCodes(['mes:pro-route:update']); // 是否可切换状态

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
  formModalApi.setData({ formType: 'create' }).open();
}

/** 编辑工艺路线（仅停用状态可编辑） */
function handleEdit(row: MesProRouteApi.Route) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 详情查看 */
function handleDetail(row: MesProRouteApi.Route) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 切换状态 */
async function handleStatusChange(
  newStatus: number,
  row: MesProRouteApi.Route,
): Promise<boolean | undefined> {
  try {
    await confirm(
      `确认要将"${row.name}"工艺路线切换为【${getDictLabel(DICT_TYPE.COMMON_STATUS, newStatus)}】吗？`,
    );
  } catch {
    return false;
  }
  await updateRouteStatus(row.id!, newStatus);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

/** 删除（仅停用状态可删除） */
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

/** 导出 */
async function handleExport() {
  const data = await exportRoute(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '工艺路线.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(handleStatusChange, statusEditable),
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
