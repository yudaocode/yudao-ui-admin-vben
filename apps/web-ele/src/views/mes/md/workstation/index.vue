<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesMdWorkstationApi } from '#/api/mes/md/workstation';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWorkstation,
  exportWorkstation,
  getWorkstationPage,
} from '#/api/mes/md/workstation';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建工作站 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看工作站 */
function handleDetail(row: MesMdWorkstationApi.Workstation) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 编辑工作站 */
function handleEdit(row: MesMdWorkstationApi.Workstation) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 删除工作站 */
async function handleDelete(row: MesMdWorkstationApi.Workstation) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteWorkstation(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 查看工作站条码 */
function handleBarcode(row: MesMdWorkstationApi.Workstation) {
  if (!row.id) {
    return;
  }
  barcodeDetailRef.value?.openByBusiness(
    row.id,
    BarcodeBizTypeEnum.WORKSTATION,
    row.code,
    row.name,
  );
}

/** 导出工作站 */
async function handleExport() {
  const data = await exportWorkstation(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '工作站.xls', source: data });
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
          return await getWorkstationPage({
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MesMdWorkstationApi.Workstation>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【基础】车间设置、工作站设置"
        url="https://doc.iocoder.cn/mes/md/workshop/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <BarcodeDetail ref="barcodeDetailRef" />

    <Grid table-title="工作站列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['工作站']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:md-workstation:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:md-workstation:export'],
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
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:md-workstation:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:md-workstation:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '条码',
              type: 'primary',
              link: true,
              auth: ['mes:md-workstation:query'],
              onClick: handleBarcode.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
