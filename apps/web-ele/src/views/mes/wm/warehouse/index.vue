<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmWarehouseApi } from '#/api/mes/wm/warehouse';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteWarehouse, getWarehousePage } from '#/api/mes/wm/warehouse';
import { $t } from '#/locales';

import { BarcodeDetail } from '../barcode/components';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建仓库 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看仓库详情 */
function handleDetail(row: MesWmWarehouseApi.Warehouse) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑仓库 */
function handleEdit(row: MesWmWarehouseApi.Warehouse) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 删除仓库 */
async function handleDelete(row: MesWmWarehouseApi.Warehouse) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteWarehouse(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 跳转库区列表 */
function handleOpenLocation(row: MesWmWarehouseApi.Warehouse) {
  router.push({
    name: 'MesWmLocation',
    query: { warehouseId: String(row.id) },
  });
}

/** 查看仓库条码 */
function handleBarcode(row: MesWmWarehouseApi.Warehouse) {
  barcodeDetailRef.value?.openByBusiness(
    row.id!,
    BarcodeBizTypeEnum.WAREHOUSE,
    row.code,
    row.name,
  );
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
          return await getWarehousePage({
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
  } as VxeTableGridOptions<MesWmWarehouseApi.Warehouse>,
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

    <Grid table-title="仓库列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['仓库']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-warehouse:create'],
              onClick: handleCreate,
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
              label: '库区',
              type: 'primary',
              link: true,
              auth: ['mes:wm-warehouse:query'],
              onClick: handleOpenLocation.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-warehouse:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-warehouse:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '条码',
              type: 'primary',
              link: true,
              auth: ['mes:wm-warehouse:query'],
              onClick: handleBarcode.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
