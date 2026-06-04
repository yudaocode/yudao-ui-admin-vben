<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmBarcodeApi } from '#/api/mes/wm/barcode';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteBarcode,
  exportBarcode,
  getBarcodePage,
} from '#/api/mes/wm/barcode';
import { $t } from '#/locales';

import { Barcode, BarcodeDetail } from './components';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: MesWmBarcodeApi.Barcode[];
}) {
  checkedIds.value = records.map((item) => item.id!);
}

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建条码 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑条码 */
function handleEdit(row: MesWmBarcodeApi.Barcode) {
  formModalApi.setData(row).open();
}

/** 删除条码 */
async function handleDelete(row: MesWmBarcodeApi.Barcode) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.bizName || row.bizCode || '']),
    duration: 0,
  });
  try {
    await deleteBarcode(row.id!);
    message.success(
      $t('ui.actionMessage.deleteSuccess', [row.bizName || row.bizCode || '']),
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 批量删除条码 */
async function handleDeleteBatch() {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [`${checkedIds.value.length} 条`]),
    duration: 0,
  });
  try {
    await Promise.all(checkedIds.value.map((id) => deleteBarcode(id)));
    message.success($t('ui.actionMessage.deleteSuccess', ['']));
    checkedIds.value = [];
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 查看条码 */
function handleView(row: MesWmBarcodeApi.Barcode) {
  barcodeDetailRef.value?.open(row);
}

/** 跳转条码配置 */
function handleConfig() {
  router.push({ name: 'MesWmBarcodeConfig' });
}

/** 导出表格 */
async function handleExport() {
  const data = await exportBarcode(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '条码清单.xls', source: data });
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
          return await getBarcodePage({
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
      height: 80,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<MesWmBarcodeApi.Barcode>,
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
        title="【仓库】仓库与库区库位、条码赋码、SN码"
        url="https://doc.iocoder.cn/mes/wm/warehouse-setup/"
      />
    </template>

    <FormModal @success="handleRefresh" />
    <BarcodeDetail ref="barcodeDetailRef" />

    <Grid table-title="条码列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['条码']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-barcode:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-barcode:delete'],
              disabled: checkedIds.length === 0,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  `${checkedIds.length} 条`,
                ]),
                confirm: handleDeleteBatch,
              },
            },
            {
              label: '条码设置',
              type: 'primary',
              auth: ['mes:wm-barcode-config:query'],
              onClick: handleConfig,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-barcode:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #barcode="{ row }">
        <div v-if="row.content" class="flex justify-center">
          <Barcode
            :content="row.content"
            :format="row.format"
            :height="60"
            :width="140"
          />
        </div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.detail'),
              type: 'link',
              auth: ['mes:wm-barcode:query'],
              onClick: handleView.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-barcode:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-barcode:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.bizName || row.bizCode || '',
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
