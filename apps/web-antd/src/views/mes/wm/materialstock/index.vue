<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, Card, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportMaterialStock,
  getMaterialStockPage,
  updateMaterialStockFrozen,
} from '#/api/mes/wm/materialstock';
import { $t } from '#/locales';
import { MdItemTypeTree } from '#/views/mes/md/item/type/components';
import { WmBatchDetail } from '#/views/mes/wm/batch/components';
import AreaForm from '#/views/mes/wm/warehouse/area/modules/form.vue';

import { useGridColumns, useGridFormSchema } from './data';

const [AreaModal, areaModalApi] = useVbenModal({
  connectedComponent: AreaForm,
  destroyOnClose: true,
});

const batchDetailRef = ref<InstanceType<typeof WmBatchDetail>>();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportMaterialStock({
    ...(await gridApi.formApi.getValues()),
    itemTypeId: searchItemTypeId.value,
  });
  downloadFileFromBlobPart({ fileName: '库存台账.xls', source: data });
}

/** 选择物料分类 */
const searchItemTypeId = ref<number | undefined>(undefined);
function handleTypeNodeClick(row: undefined | { id?: number }) {
  searchItemTypeId.value = row?.id;
  handleRefresh();
}

/** 打开库位详情弹窗 */
function handleOpenAreaDetail(row: MesWmMaterialStockApi.MaterialStock) {
  if (!row.areaId) {
    return;
  }
  areaModalApi.setData({ formType: 'detail', id: row.areaId }).open();
}

/** 打开批次详情弹窗 */
function handleOpenBatchDetail(row: MesWmMaterialStockApi.MaterialStock) {
  if (!row.batchId) {
    return;
  }
  batchDetailRef.value?.open(row.batchId);
}

/** 处理冻结状态切换 */
async function handleFrozenChange(
  newFrozen: boolean,
  row: MesWmMaterialStockApi.MaterialStock,
): Promise<boolean | undefined> {
  const text = newFrozen ? '冻结' : '解冻';
  try {
    await confirm(`确认要"${text}"该库存记录吗？`);
  } catch {
    return false;
  }
  // 更新冻结状态
  await updateMaterialStockFrozen({
    id: row.id!,
    frozen: newFrozen,
  });
  // 提示并返回成功
  message.success(`${text}成功`);
  return true;
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleFrozenChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMaterialStockPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            itemTypeId: searchItemTypeId.value,
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
  } as VxeTableGridOptions<MesWmMaterialStockApi.MaterialStock>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】批次管理、库存现有量、库存事务"
        url="https://doc.iocoder.cn/mes/wm/stock/"
      />
    </template>

    <AreaModal />
    <WmBatchDetail ref="batchDetailRef" />

    <div class="flex h-full w-full">
      <!-- 左侧物料分类树 -->
      <Card class="mr-4 h-full w-1/6">
        <MdItemTypeTree @node-click="handleTypeNodeClick" />
      </Card>
      <!-- 右侧库存台账列表 -->
      <div class="w-5/6">
        <Grid table-title="库存台账列表">
          <template #toolbar-tools>
            <TableAction
              :actions="[
                {
                  label: $t('ui.actionTitle.export'),
                  type: 'primary',
                  icon: ACTION_ICON.DOWNLOAD,
                  auth: ['mes:wm-material-stock:export'],
                  onClick: handleExport,
                },
              ]"
            />
          </template>
          <template #batchCode="{ row }">
            <Button
              v-if="row.batchId"
              :title="row.batchCode"
              size="small"
              type="link"
              @click="handleOpenBatchDetail(row)"
            >
              {{ row.batchCode }}
            </Button>
            <span v-else>-</span>
          </template>
          <template #areaName="{ row }">
            <Button
              v-if="row.areaId"
              :title="row.areaName"
              size="small"
              type="link"
              @click="handleOpenAreaDetail(row)"
            >
              {{ row.areaName }}
            </Button>
            <span v-else>-</span>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
