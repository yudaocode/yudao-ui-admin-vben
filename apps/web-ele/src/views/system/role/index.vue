<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download, Plus } from '@vben/icons';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRole,
  deleteRoleList,
  exportRole,
  getRolePage,
} from '#/api/system/role';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import AssignDataPermissionForm from './modules/assign-data-permission-form.vue';
import AssignMenuForm from './modules/assign-menu-form.vue';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [AssignDataPermissionFormModel, assignDataPermissionFormApi] =
  useVbenModal({
    connectedComponent: AssignDataPermissionForm,
    destroyOnClose: true,
  });

const [AssignMenuFormModel, assignMenuFormApi] = useVbenModal({
  connectedComponent: AssignMenuForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportRole(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '角色.xls', source: data });
}

/** 编辑角色 */
function onEdit(row: SystemRoleApi.Role) {
  formModalApi.setData(row).open();
}

/** 创建角色 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 删除角色 */
async function onDelete(row: SystemRoleApi.Role) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteRole(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除角色 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该角色吗？');
  await deleteRoleList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemRoleApi.Role[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 分配角色的数据权限 */
function onAssignDataPermission(row: SystemRoleApi.Role) {
  assignDataPermissionFormApi.setData(row).open();
}

/** 分配角色的菜单权限 */
function onAssignMenu(row: SystemRoleApi.Role) {
  assignMenuFormApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<SystemRoleApi.Role>) {
  switch (code) {
    case 'assign-data-permission': {
      onAssignDataPermission(row);
      break;
    }
    case 'assign-menu': {
      onAssignMenu(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRolePage({
            page: page.currentPage,
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemRoleApi.Role>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="功能权限"
        url="https://doc.iocoder.cn/resource-permission"
      />
      <DocAlert title="数据权限" url="https://doc.iocoder.cn/data-permission" />
    </template>

    <FormModal @success="onRefresh" />
    <AssignDataPermissionFormModel @success="onRefresh" />
    <AssignMenuFormModel @success="onRefresh" />
    <Grid table-title="角色列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          @click="onCreate"
          v-access:code="['system:role:create']"
        >
          <Plus class="mr-2 size-5" />
          {{ $t('ui.actionTitle.create', ['角色']) }}
        </ElButton>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:role:export']"
        >
          <Download class="mr-2 size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
        <ElButton
          type="danger"
          class="ml-2"
          @click="onDeleteBatch"
          v-access:code="['system:role:delete']"
          :disabled="isEmpty(checkedIds)"
        >
          <i class="fa-solid fa-trash-can mr-2"></i>
          {{ $t('ui.actionTitle.deleteBatch') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
