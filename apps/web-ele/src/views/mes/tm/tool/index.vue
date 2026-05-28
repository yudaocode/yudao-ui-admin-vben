<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesTmToolApi } from '#/api/mes/tm/tool';
import type { MesTmToolTypeApi } from '#/api/mes/tm/tool/type';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElCard, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTool, exportTool, getToolPage } from '#/api/mes/tm/tool';
import { $t } from '#/locales';
import { TmToolTypeList } from '#/views/mes/tm/tool/type/components';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const selectedToolTypeId = ref<number>(); // 当前选中的工具类型编号

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建工具 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看工具 */
function handleDetail(row: MesTmToolApi.Tool) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑工具 */
function handleEdit(row: MesTmToolApi.Tool) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除工具 */
async function handleDelete(row: MesTmToolApi.Tool) {
  const hideLoading = ElLoading.service({ text: $t('ui.actionMessage.deleting', [row.name]) });
  try {
    await deleteTool(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出工具 */
async function handleExport() {
  const data = await exportTool(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '工具.xls', source: data });
}

/** 工具类型选中变化 */
function handleToolTypeSelect(row: MesTmToolTypeApi.ToolType | undefined) {
  selectedToolTypeId.value = row?.id;
  handleRefresh();
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
          return await getToolPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            toolTypeId: selectedToolTypeId.value,
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
      search: true,
    },
  } as VxeTableGridOptions<MesTmToolApi.Tool>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【工具】工具类型、工装夹具台账"
        url="https://doc.iocoder.cn/mes/tm/tool/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <div class="flex h-full w-full">
      <ElCard class="mr-4 h-full w-1/6">
        <TmToolTypeList @select="handleToolTypeSelect" />
      </ElCard>
      <div class="w-5/6">
        <Grid table-title="工具列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['工具']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['mes:tm-tool:create'],
                  onClick: handleCreate,
                },
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['mes:tm-tool:export'],
                  onClick: handleExport,
                },
              ]"
            />
          </template>
          <template #code="{ row }">
            <ElButton link type="primary" @click="handleDetail(row)">{{ row.code }}</ElButton>
          </template>
          <template #actions="{ row }">
            <TableAction
              :actions="[
                {
                  label: $t('common.edit'),
                  type: 'primary',
                  link: true,
                  icon: ACTION_ICON.EDIT,
                  auth: ['mes:tm-tool:update'],
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['mes:tm-tool:delete'],
                  popConfirm: {
                    title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                    confirm: handleDelete.bind(null, row),
                  },
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
