<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';
import type { SystemUserApi } from '#/api/system/user';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus, Upload } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUser,
  exportUser,
  getUserPage,
  updateUserStatus,
} from '#/api/system/user';
import { DocAlert } from '#/components/doc-alert';
import { ACTION_KEY, TableAction } from '#/components/table-action';
import { $t } from '#/locales';
import { DICT_TYPE, getDictLabel } from '#/utils';

import { useGridColumns, useGridFormSchema } from './data';
import AssignRoleForm from './modules/assign-role-form.vue';
import DeptTree from './modules/dept-tree.vue';
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

/** 导出表格 */
async function onExport() {
  const data = await exportUser(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '用户.xls', source: data });
}

/** 选择部门 */
const searchDeptId = ref<number | undefined>(undefined);
async function onDeptSelect(dept: SystemDeptApi.Dept) {
  searchDeptId.value = dept.id;
  onRefresh();
}

/** 创建用户 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 导入用户 */
function onImport() {
  importModalApi.open();
}

/** 编辑用户 */
function onEdit(row: SystemUserApi.User) {
  formModalApi.setData(row).open();
}

/** 删除用户 */
async function onDelete(row: SystemUserApi.User) {
  message.loading({
    content: $t('ui.actionMessage.deleting', [row.username]),
    key: ACTION_KEY,
  });
  await deleteUser(row.id as number);
  message.success({
    content: $t('ui.actionMessage.deleteSuccess', [row.username]),
    key: ACTION_KEY,
  });
  onRefresh();
}

/** 重置密码 */
function onResetPassword(row: SystemUserApi.User) {
  resetPasswordModalApi.setData(row).open();
}

/** 分配角色 */
function onAssignRole(row: SystemUserApi.User) {
  assignRoleModalApi.setData(row).open();
}

/** 更新用户状态 */
async function onStatusChange(
  newStatus: number,
  row: SystemUserApi.User,
): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    confirm({
      content: `你要将${row.username}的状态切换为【${getDictLabel(DICT_TYPE.COMMON_STATUS, newStatus)}】吗？`,
    })
      .then(async () => {
        // 更新用户状态
        const res = await updateUserStatus(row.id as number, newStatus);
        if (res) {
          // 提示并返回成功
          message.success($t('ui.actionMessage.operationSuccess'));
          resolve(true);
        } else {
          reject(new Error('更新失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            deptId: searchDeptId.value,
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
  } as VxeTableGridOptions<SystemUserApi.User>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="用户体系" url="https://doc.iocoder.cn/user-center/" />
      <DocAlert title="三方登陆" url="https://doc.iocoder.cn/social-user/" />
      <DocAlert
        title="Excel 导入导出"
        url="https://doc.iocoder.cn/excel-import-and-export/"
      />
    </template>

    <FormModal @success="onRefresh" />
    <ResetPasswordModal @success="onRefresh" />
    <AssignRoleModal @success="onRefresh" />
    <ImportModal @success="onRefresh" />

    <div class="flex h-full w-full">
      <!-- 左侧部门树 -->
      <div class="h-full w-1/6 pr-4">
        <DeptTree @select="onDeptSelect" />
      </div>
      <!-- 右侧用户列表 -->
      <div class="w-5/6">
        <Grid table-title="用户列表">
          <template #toolbar-tools>
            <Button
              type="primary"
              @click="onCreate"
              v-access:code="['system:user:create']"
            >
              <Plus class="size-5" />
              {{ $t('ui.actionTitle.create', ['用户']) }}
            </Button>
            <Button
              type="primary"
              class="ml-2"
              @click="onExport"
              v-access:code="['system:user:export']"
            >
              <Download class="size-5" />
              {{ $t('ui.actionTitle.export') }}
            </Button>
            <Button
              type="primary"
              class="ml-2"
              @click="onImport"
              v-access:code="['system:user:import']"
            >
              <Upload class="size-5" />
              {{ $t('ui.actionTitle.import', ['用户']) }}
            </Button>
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'link',
                  icon: 'ant-design:edit-outlined',
                  auth: ['system:user:update'],
                  onClick: onEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'link',
                  danger: true,
                  icon: 'ant-design:delete-outlined',
                  auth: ['system:user:delete'],
                  popConfirm: {
                    title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                    confirm: onDelete.bind(null, row),
                  },
                },
              ]"
              :drop-down-actions="[
                {
                  label: '数据权限',
                  type: 'link',
                  auth: ['system:permission:assign-user-role'],
                  onClick: onAssignRole.bind(null, row),
                },
                {
                  label: '菜单权限',
                  type: 'link',
                  auth: ['system:user:update-password'],
                  onClick: onResetPassword.bind(null, row),
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
