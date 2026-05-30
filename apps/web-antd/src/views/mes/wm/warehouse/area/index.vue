<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmWarehouseAreaApi } from '#/api/mes/wm/warehouse/area';

import { ref } from 'vue';
import { useRoute } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { Alert, Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWarehouseArea,
  getWarehouseAreaPage,
} from '#/api/mes/wm/warehouse/area';
import { getWarehouseLocation } from '#/api/mes/wm/warehouse/location';
import { $t } from '#/locales';

import { BarcodeDetail } from '../../barcode/components';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const route = useRoute();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

/** 当前库区上下文（同步从 URL 解析，确保首次查询带得上 locationId） */
const currentLocation = ref<{
  id: number;
  name: string;
  warehouseId: number;
  warehouseName: string;
}>(
  (() => {
    const id = Number(route.query.locationId);
    return Number.isInteger(id) && id > 0
      ? { id, name: '', warehouseId: 0, warehouseName: '' }
      : { id: 0, name: '', warehouseId: 0, warehouseName: '' };
  })(),
);

/** 异步加载库区/仓库名称（不阻塞列表查询） */
async function loadLocationName() {
  if (!currentLocation.value.id) {
    return;
  }
  try {
    const location = await getWarehouseLocation(currentLocation.value.id);
    currentLocation.value.name = location.name || '';
    currentLocation.value.warehouseId = location.warehouseId || 0;
    currentLocation.value.warehouseName = location.warehouseName || '';
  } catch {
    // 忽略上级名称加载异常，不影响列表查询
  }
}
loadLocationName();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建库位 */
function handleCreate() {
  formModalApi
    .setData({
      formType: 'create',
      locationId: currentLocation.value.id || undefined,
      warehouseId: currentLocation.value.warehouseId || undefined,
    })
    .open();
}

/** 查看库位详情 */
function handleDetail(row: MesWmWarehouseAreaApi.WarehouseArea) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑库位 */
function handleEdit(row: MesWmWarehouseAreaApi.WarehouseArea) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 删除库位 */
async function handleDelete(row: MesWmWarehouseAreaApi.WarehouseArea) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
  });
  try {
    await deleteWarehouseArea(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 查看库位条码 */
function handleBarcode(row: MesWmWarehouseAreaApi.WarehouseArea) {
  barcodeDetailRef.value?.openByBusiness(
    row.id!,
    BarcodeBizTypeEnum.AREA,
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
          return await getWarehouseAreaPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            locationId: currentLocation.value.id || undefined,
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
  } as VxeTableGridOptions<MesWmWarehouseAreaApi.WarehouseArea>,
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

    <Alert
      v-if="currentLocation.id"
      class="mb-3"
      :message="`当前仓库/库区：${currentLocation.warehouseName || `#${currentLocation.warehouseId || '-'}`} / ${currentLocation.name || `#${currentLocation.id}`}`"
      show-icon
      type="info"
    />

    <Grid table-title="库位列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['库位']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-warehouse:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #code="{ row }">
        <Button type="link" @click="handleDetail(row)">
          {{ row.code }}
        </Button>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-warehouse:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-warehouse:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '条码',
              type: 'link',
              auth: ['mes:wm-warehouse:query'],
              onClick: handleBarcode.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
