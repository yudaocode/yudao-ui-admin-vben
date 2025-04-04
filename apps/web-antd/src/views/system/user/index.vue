<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button, message, Modal } from 'ant-design-vue';
import { Plus, Download } from '@vben/icons';
import Form from './modules/form.vue';
import ResetPasswordForm from './modules/reset-password-form.vue';
import AssignRoleForm from './modules/assign-role-form.vue';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage, deleteUser, exportUser, updateUserStatus } from '#/api/system/user';
import { downloadByData } from '#/utils/download';
import { DICT_TYPE, getDictLabel } from '#/utils/dict';

import { useGridColumns, useGridFormSchema } from './data';

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

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportUser(await gridApi.formApi.getValues());
  downloadByData(data, '用户.xls');
}

/** 创建用户 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑用户 */
function onEdit(row: SystemUserApi.SystemUser) {
  formModalApi.setData(row).open();
}

/** 删除用户 */
async function onDelete(row: SystemUserApi.SystemUser) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.username]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteUser(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.username]),
      key: 'action_process_msg',
    });
    onRefresh();
  } catch (error) {
    hideLoading();
  }
}

/** 重置密码 */
function onResetPassword(row: SystemUserApi.SystemUser) {
  resetPasswordModalApi.setData(row).open();
}

/** 分配角色 */
function onAssignRole(row: SystemUserApi.SystemUser) {
  assignRoleModalApi.setData(row).open();
}

// TODO @芋艿：后续怎么简化一下 confirm 的实现。
/** 更新用户状态 */
async function onStatusChange(newStatus: number, row: SystemUserApi.SystemUser): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      title: '切换状态',
      content: `你要将${row.username}的状态切换为【${getDictLabel(DICT_TYPE.COMMON_STATUS, newStatus)}】吗？`,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        // 更新用户状态
        updateUserStatus(row.id as number, newStatus)
          .then(() => {
            // 提示并返回成功
            message.success({
              content: $t('ui.actionMessage.operationSuccess'),
              key: 'action_process_msg',
            });
            resolve(true);
          })
          .catch((error) => {
            reject(error);
          });
      },
    });
  });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemUserApi.SystemUser>) {
  switch (code) {
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'reset-password': {
      onResetPassword(row);
      break;
    }
    case 'assign-role': {
      onAssignRole(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
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
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemUserApi.SystemUser>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <ResetPasswordModal @success="onRefresh" />
    <AssignRoleModal @success="onRefresh" />
    <Grid table-title="用户列表">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['用户']) }}
        </Button>
        <Button type="primary" class="ml-2" @click="onExport">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
