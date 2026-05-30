<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmPackageLineApi } from '#/api/mes/wm/packages/line';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePackageLine,
  getPackageLinePage,
} from '#/api/mes/wm/packages/line';
import { $t } from '#/locales';

import { useLineGridColumns } from '../data';
import LineForm from './line-form.vue';

const props = defineProps<{
  editable: boolean; // 是否可编辑（草稿态）
  packageId: number; // 所属装箱单编号
}>();

const [LineFormModal, lineFormModalApi] = useVbenModal({
  connectedComponent: LineForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 添加装箱明细 */
function handleCreate() {
  lineFormModalApi.setData({ packageId: props.packageId }).open();
}

/** 编辑装箱明细 */
function handleEdit(row: MesWmPackageLineApi.PackageLine) {
  lineFormModalApi.setData({ id: row.id, packageId: props.packageId }).open();
}

/** 删除装箱明细 */
async function handleDelete(row: MesWmPackageLineApi.PackageLine) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deletePackageLine(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.packageId) {
            return { list: [], total: 0 };
          }
          return await getPackageLinePage({
            packageId: props.packageId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<MesWmPackageLineApi.PackageLine>,
});
</script>

<template>
  <div>
    <LineFormModal @success="handleRefresh" />
    <Grid table-title="装箱清单">
      <template #toolbar-tools>
        <TableAction
          v-if="editable"
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['装箱明细']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
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
              icon: ACTION_ICON.EDIT,
              ifShow: editable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: editable,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
