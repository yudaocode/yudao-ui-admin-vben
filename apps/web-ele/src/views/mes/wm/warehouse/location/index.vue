<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmWarehouseLocationApi } from '#/api/mes/wm/warehouse/location';

import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { BarcodeBizTypeEnum } from '@vben/constants';

import { ElAlert, ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { getWarehouse } from '#/api/mes/wm/warehouse';
import {
  deleteWarehouseLocation,
  getWarehouseLocationPage,
} from '#/api/mes/wm/warehouse/location';
import { $t } from '#/locales';

import { BarcodeDetail } from '../../barcode/components';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const route = useRoute();
const router = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>();

/** 当前仓库上下文（同步从 URL 解析，确保首次查询带得上 warehouseId） */
const currentWarehouse = ref<{ id: number; name: string }>(
  (() => {
    const id = Number(route.query.warehouseId);
    return Number.isInteger(id) && id > 0
      ? { id, name: '' }
      : { id: 0, name: '' };
  })(),
);

/** 异步加载仓库名称（不阻塞列表查询） */
async function loadWarehouseName() {
  if (!currentWarehouse.value.id) {
    return;
  }
  try {
    const warehouse = await getWarehouse(currentWarehouse.value.id);
    currentWarehouse.value.name = warehouse.name || '';
  } catch {
    // 忽略上级名称加载异常，不影响列表查询
  }
}
loadWarehouseName();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建库区 */
function handleCreate() {
  formModalApi
    .setData({
      formType: 'create',
      warehouseId: currentWarehouse.value.id || undefined,
    })
    .open();
}

/** 查看库区详情 */
function handleDetail(row: MesWmWarehouseLocationApi.WarehouseLocation) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑库区 */
function handleEdit(row: MesWmWarehouseLocationApi.WarehouseLocation) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 删除库区 */
async function handleDelete(row: MesWmWarehouseLocationApi.WarehouseLocation) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteWarehouseLocation(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 跳转库位列表 */
function handleOpenArea(row: MesWmWarehouseLocationApi.WarehouseLocation) {
  router.push({
    name: 'MesWmArea',
    query: { locationId: String(row.id) },
  });
}

/** 查看库区条码 */
function handleBarcode(row: MesWmWarehouseLocationApi.WarehouseLocation) {
  barcodeDetailRef.value?.openByBusiness(
    row.id!,
    BarcodeBizTypeEnum.LOCATION,
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
          return await getWarehouseLocationPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            warehouseId: currentWarehouse.value.id || undefined,
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
  } as VxeTableGridOptions<MesWmWarehouseLocationApi.WarehouseLocation>,
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

    <ElAlert
      v-if="currentWarehouse.id"
      class="mb-3"
      :closable="false"
      show-icon
      :title="`当前仓库：${currentWarehouse.name || `#${currentWarehouse.id}`}`"
      type="info"
    />

    <Grid table-title="库区列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['库区']),
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
              label: '库位',
              type: 'primary',
              link: true,
              auth: ['mes:wm-warehouse:query'],
              onClick: handleOpenArea.bind(null, row),
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
