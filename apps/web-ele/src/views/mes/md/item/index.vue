<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdItemApi } from '#/api/mes/md/item';
import type { MesMdItemTypeApi } from '#/api/mes/md/item/type';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElCard, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteItem,
  exportItem,
  getItemPage,
  updateItemStatus,
} from '#/api/mes/md/item';
import { $t } from '#/locales';
import { MdItemTypeTree } from '#/views/mes/md/item/type/components';
import { PrinterLabel } from '#/views/mes/wm/barcode/components';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';
import ImportForm from './modules/import-form.vue';

const selectedItemTypeId = ref<number>(); // 当前选中的物料分类编号

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

/** 创建物料 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看物料 */
function handleDetail(row: MesMdItemApi.Item) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑物料 */
function handleEdit(row: MesMdItemApi.Item) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除物料 */
async function handleDelete(row: MesMdItemApi.Item) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteItem(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出物料 */
async function handleExport() {
  const data = await exportItem(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '物料产品.xls', source: data });
}

/** 导入物料 */
function handleImport() {
  importModalApi.open();
}

/** 分类树点击 */
function handleTypeNodeClick(row: MesMdItemTypeApi.ItemType | undefined) {
  selectedItemTypeId.value = row?.id;
  handleRefresh();
}

/** 更新物料状态 */
async function handleStatusChange(
  newStatus: number,
  row: MesMdItemApi.Item,
): Promise<boolean | undefined> {
  try {
    await confirm(
      `确认要将"${row.name}"物料切换为【${getDictLabel(DICT_TYPE.COMMON_STATUS, newStatus)}】吗？`,
    );
  } catch {
    return false;
  }
  await updateItemStatus(row.id!, newStatus);
  ElMessage.success($t('ui.actionMessage.operationSuccess'));
  return true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            itemTypeId: selectedItemTypeId.value,
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
  } as VxeTableGridOptions<MesMdItemApi.Item>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【基础】物料产品、分类、计量单位"
        url="https://doc.iocoder.cn/mes/md/product/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <ImportModal @success="handleRefresh" />

    <div class="flex h-full w-full">
      <ElCard class="mr-4 h-full w-1/6">
        <MdItemTypeTree @node-click="handleTypeNodeClick" />
      </ElCard>
      <div class="w-5/6">
        <Grid table-title="物料产品列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.create', ['物料']),
                  type: 'primary',
                  icon: ACTION_ICON.ADD,
                  auth: ['mes:md-item:create'],
                  onClick: handleCreate,
                },
                {
                  label: $t('ui.actionTitle.import'),
                  type: 'primary',
                  icon: ACTION_ICON.UPLOAD,
                  auth: ['mes:md-item:import'],
                  onClick: handleImport,
                },
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['mes:md-item:export'],
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
            <div class="flex items-center justify-center">
              <TableAction
                :actions="[
                  {
                    label: $t('common.edit'),
                    type: 'primary',
                    link: true,
                    icon: ACTION_ICON.EDIT,
                    auth: ['mes:md-item:update'],
                    onClick: handleEdit.bind(null, row),
                  },
                  {
                    label: $t('common.delete'),
                    type: 'danger',
                    link: true,
                    icon: ACTION_ICON.DELETE,
                    auth: ['mes:md-item:delete'],
                    popConfirm: {
                      title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                      confirm: handleDelete.bind(null, row),
                    },
                  },
                ]"
              />
              <PrinterLabel
                :biz-id="row.id"
                :biz-code="row.code"
                biz-type="ITEM"
              />
            </div>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
