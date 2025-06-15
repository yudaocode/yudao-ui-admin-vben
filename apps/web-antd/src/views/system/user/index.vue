<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUser,
  deleteUserList,
  exportUser,
  getUserPage,
  importUserTemplate,
  updateUserStatus,
} from '#/api/system/user';
import { $t } from '#/locales';
import { CommonStatusEnum } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import AssignRoleForm from './modules/assign-role-form.vue';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';
import ResetPasswordForm from './modules/reset-password-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [ResetPasswordModal, resetPasswordModalApi] = useVbenModal({
  connectedComponent: ResetPasswordForm,
  destroyOnClose: true,
});

const [AssignRoleModal, assignRoleModalApi] = useVbenModal({
  connectedComponent: AssignRoleForm,
  destroyOnClose: true,
});

const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建用户 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑用户 */
function handleEdit(row: SystemUserApi.User) {
  formModalApi.setData(row).open();
}

/** 删除用户 */
async function handleDelete(row: SystemUserApi.User) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.username]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteUser(row.id as number);
    message.success($t('ui.actionMessage.deleteSuccess', [row.username]));
    onRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemUserApi.User[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 批量删除用户 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting'),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteUserList(checkedIds.value);
    message.success($t('ui.actionMessage.deleteSuccess'));
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 重置密码 */
function handleResetPassword(row: SystemUserApi.User) {
  resetPasswordModalApi.setData({ id: row.id }).open();
}

/** 分配角色 */
function handleAssignRole(row: SystemUserApi.User) {
  assignRoleModalApi.setData(row).open();
}

/** 导入用户 */
function handleImport() {
  importModalApi.open();
}

/** 导出用户 */
async function handleExport() {
  const data = await exportUser(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用户数据.xls', source: data });
}

/** 下载导入模板 */
async function handleImportTemplate() {
  const data = await importUserTemplate();
  downloadFileFromBlobPart({ fileName: '用户导入模板.xlsx', source: data });
}

/** 用户状态修改 */
async function handleStatusChange(
  newStatus: number,
  row: SystemUserApi.User,
): Promise<boolean | undefined> {
  try {
    await updateUserStatus(row.id as number, newStatus);
    message.success(
      $t('ui.actionMessage.updateSuccess', [
        row.username,
        newStatus === CommonStatusEnum.ENABLE ? '启用' : '停用',
      ]),
    );
    return true;
  } catch {
    return false;
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleStatusChange),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemUserApi.User>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <ResetPasswordModal @success="onRefresh" />
    <AssignRoleModal @success="onRefresh" />
    <ImportModal @success="onRefresh" />

    <Grid table-title="用户列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['用户']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:user:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.import'),
              type: 'primary',
              icon: ACTION_ICON.UPLOAD,
              auth: ['system:user:import'],
              onClick: handleImport,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:user:export'],
              onClick: handleExport,
            },
            {
              label: '下载模板',
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['system:user:import'],
              onClick: handleImportTemplate,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              disabled: isEmpty(checkedIds),
              icon: ACTION_ICON.DELETE,
              auth: ['system:user:delete'],
              onClick: handleDeleteBatch,
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
              icon: ACTION_ICON.EDIT,
              auth: ['system:user:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['system:user:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.username]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
          :drop-down-actions="[
            {
              label: '重置密码',
              type: 'link',
              auth: ['system:user:update-password'],
              onClick: handleResetPassword.bind(null, row),
            },
            {
              label: '分配角色',
              type: 'link',
              auth: ['system:permission:assign-user-role'],
              onClick: handleAssignRole.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
