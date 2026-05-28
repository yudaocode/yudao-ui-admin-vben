<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesDvMachineryApi } from '#/api/mes/dv/machinery';
import type { MesDvMachineryTypeApi } from '#/api/mes/dv/machinery/type';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteMachinery, exportMachinery, getMachineryPage } from '#/api/mes/dv/machinery';
import { $t } from '#/locales';
import { MachineryTypeTree } from '#/views/mes/dv/machinery/type/components';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';

const selectedMachineryTypeId = ref<number>(); // 选中设备类型编号

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [ImportModal, importModalApi] = useVbenModal({
  connectedComponent: ImportForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建设备 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看设备 */
function handleDetail(row: MesDvMachineryApi.Machinery) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑设备 */
function handleEdit(row: MesDvMachineryApi.Machinery) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除设备 */
async function handleDelete(row: MesDvMachineryApi.Machinery) {
  const hideLoading = ElLoading.service({ text: $t('ui.actionMessage.deleting', [row.name]) });
  try {
    await deleteMachinery(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading.close();
  }
}

/** 导出设备 */
async function handleExport() {
  const data = await exportMachinery(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '设备台账.xls', source: data });
}

/** 导入设备 */
function handleImport() {
  importModalApi.open();
}

/** 按设备类型筛选 */
function handleTypeNodeClick(row: MesDvMachineryTypeApi.MachineryType | undefined) {
  selectedMachineryTypeId.value = row?.id;
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
        query: async ({ page }, formValues) =>
          await getMachineryPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            machineryTypeId: selectedMachineryTypeId.value,
          }),
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
  } as VxeTableGridOptions<MesDvMachineryApi.Machinery>,
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
    <ImportModal @success="handleRefresh" />
    <div class="flex h-full w-full">
      <div class="mr-4 h-full w-1/6">
        <MachineryTypeTree @node-click="handleTypeNodeClick" />
      </div>
      <div class="w-5/6">
        <Grid table-title="设备台账列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['设备']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['mes:dv-machinery:create'],
                  onClick: handleCreate,
                },
                {
                  label: $t('ui.actionTitle.import'),
                  type: 'primary',
                  icon: ACTION_ICON.UPLOAD,
                  auth: ['mes:dv-machinery:import'],
                  onClick: handleImport,
                },
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['mes:dv-machinery:export'],
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
                  auth: ['mes:dv-machinery:update'],
                  onClick: handleEdit.bind(null, row),
                },
                {
                  label: $t('common.delete'),
                  type: 'danger',
                  link: true,
                  icon: ACTION_ICON.DELETE,
                  auth: ['mes:dv-machinery:delete'],
                  popConfirm: {
                    title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                    confirm: handleDelete.bind(null, row),
                  },
                },
                {
                  label: $t('common.detail'),
                  type: 'primary',
                  link: true,
                  icon: ACTION_ICON.VIEW,
                  auth: ['mes:dv-machinery:query'],
                  onClick: handleDetail.bind(null, row),
                },
              ]"
            />
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
