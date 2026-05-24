<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { handleTree } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMachineryType, getMachineryTypeList } from '#/api/mes/dv/machinery/type';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const isExpanded = ref(true); // 树形表格是否展开

/** 切换树形展开/收缩状态 */
function handleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建设备类型 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 添加下级设备类型 */
function handleAppend(row: MesDvMachineryTypeApi.MachineryType) {
  formModalApi.setData({ parentId: row.id }).open();
}

/** 编辑设备类型 */
function handleEdit(row: MesDvMachineryTypeApi.MachineryType) {
  formModalApi.setData(row).open();
}

/** 删除设备类型 */
async function handleDelete(row: MesDvMachineryTypeApi.MachineryType) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteMachineryType(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: { query: async (_, formValues) => handleTree(await getMachineryTypeList(formValues)) },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions<MesDvMachineryTypeApi.MachineryType>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设备】设备类型、设备台账"
        url="https://doc.iocoder.cn/mes/dv/device/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="设备类型列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['设备类型']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-machinery-type:create'],
              onClick: handleCreate,
            },
            {
              label: isExpanded ? '收缩' : '展开',
              type: 'primary',
              onClick: handleExpand,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['下级']),
              type: 'link',
              icon: ACTION_ICON.ADD,
              auth: ['mes:dv-machinery-type:create'],
              onClick: handleAppend.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:dv-machinery-type:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:dv-machinery-type:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
