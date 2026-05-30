<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmPackageApi } from '#/api/mes/wm/packages';

import { ref } from 'vue';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  addChildPackage,
  getPackagePage,
  removeChildPackage,
} from '#/api/mes/wm/packages';
import { $t } from '#/locales';

import { WmPackageSelectDialog } from '../components';
import { useSubPackageGridColumns } from '../data';

const props = defineProps<{
  editable: boolean; // 是否可编辑（草稿态）
  packageId: number; // 父箱编号
}>();

const dialogRef = ref<InstanceType<typeof WmPackageSelectDialog>>();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 打开装箱单选择弹窗添加子箱 */
function handleAddChild() {
  dialogRef.value?.open([], { multiple: false });
}

/** 选中回调：将选中的装箱单添加为子箱 */
async function handleSelected(rows: MesWmPackageApi.Package[]) {
  const child = rows[0];
  if (!child?.id) {
    return;
  }
  await addChildPackage(props.packageId, child.id);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

/** 移除子箱：将子箱的父箱编号清空 */
async function handleRemoveChild(row: MesWmPackageApi.Package) {
  await removeChildPackage(row.id!);
  message.success('移除成功');
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useSubPackageGridColumns(),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.packageId) {
            return { list: [], total: 0 };
          }
          return await getPackagePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            parentId: props.packageId,
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
  } as VxeTableGridOptions<MesWmPackageApi.Package>,
});
</script>

<template>
  <div>
    <WmPackageSelectDialog
      ref="dialogRef"
      childable-only
      :exclude-id="packageId"
      @selected="handleSelected"
    />
    <Grid table-title="子箱列表">
      <template #toolbar-tools>
        <TableAction
          v-if="editable"
          :actions="[
            {
              label: '添加子箱',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleAddChild,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '移除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: editable,
              popConfirm: {
                title: '确认将该装箱单从子箱列表中移除？',
                confirm: handleRemoveChild.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
