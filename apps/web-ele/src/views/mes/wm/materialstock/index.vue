<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMaterialStockApi } from '#/api/mes/wm/materialstock';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElMessage } from 'element-plus';

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
  await updateMaterialStockFrozen({
    id: row.id!,
    frozen: newFrozen,
  });
  ElMessage.success(`${text}成功`);
  return true;
}

/** 已选物料分类 */
const searchItemTypeId = ref<number>();

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
            itemTypeId: searchItemTypeId.value,
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
  } as VxeTableGridOptions<MesWmMaterialStockApi.MaterialStock>,
});

/** 物料分类树节点点击 */
function handleTypeNodeClick(row: undefined | { id?: number }) {
  searchItemTypeId.value = row?.id;
  gridApi.query();
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

/** 导出表格 */
async function handleExport() {
  const data = await exportMaterialStock({
    ...(await gridApi.formApi.getValues()),
    itemTypeId: searchItemTypeId.value,
  });
  downloadFileFromBlobPart({ fileName: '库存台账.xls', source: data });
}
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

    <div class="flex h-full gap-3">
      <div class="bg-card w-1/6 rounded p-3">
        <MdItemTypeTree @node-click="handleTypeNodeClick" />
      </div>
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
            <ElButton
              v-if="row.batchId"
              link
              size="small"
              :title="row.batchCode"
              type="primary"
              @click="handleOpenBatchDetail(row)"
            >
              {{ row.batchCode }}
            </ElButton>
            <span v-else>-</span>
          </template>
          <template #areaName="{ row }">
            <ElButton
              v-if="row.areaId"
              link
              size="small"
              :title="row.areaName"
              type="primary"
              @click="handleOpenAreaDetail(row)"
            >
              {{ row.areaName }}
            </ElButton>
            <span v-else>-</span>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
