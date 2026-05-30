<script lang="ts" setup>
import type { FormType } from '../data';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';
import type { MesProWorkOrderBomApi } from '#/api/mes/pro/workorder/bom';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import {
  MesProWorkOrderStatusEnum,
  MesProWorkOrderTypeEnum,
} from '@vben/constants';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteWorkOrderBom,
  getWorkOrderBomPage,
} from '#/api/mes/pro/workorder/bom';
import { $t } from '#/locales';

import { useBomGridColumns } from '../data';
import BomForm from './bom-form.vue';

const props = defineProps<{
  formType: FormType;
  workOrder: MesProWorkOrderApi.WorkOrder;
  workOrderId: number;
}>();

const emit = defineEmits<{
  generateWorkOrder: [row: MesProWorkOrderBomApi.WorkOrderBom];
}>();

const isEditable = computed(() => // 编辑态草稿可增删改 BOM
  ['create', 'update'].includes(props.formType) &&
  props.workOrder.status === MesProWorkOrderStatusEnum.PREPARE,
);
const isConfirmed = computed(() => // 已确认态可生成子工单
  props.workOrder.status === MesProWorkOrderStatusEnum.CONFIRMED,
);

const [BomFormModal, bomFormModalApi] = useVbenModal({
  connectedComponent: BomForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 添加 BOM 物料 */
function handleCreate() {
  bomFormModalApi
    .setData({ productId: props.workOrder.productId, workOrderId: props.workOrderId })
    .open();
}

/** 编辑 BOM 物料 */
function handleEdit(row: MesProWorkOrderBomApi.WorkOrderBom) {
  bomFormModalApi
    .setData({
      id: row.id,
      productId: props.workOrder.productId,
      workOrderId: props.workOrderId,
    })
    .open();
}

/** 删除 BOM 物料 */
async function handleDelete(row: MesProWorkOrderBomApi.WorkOrderBom) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteWorkOrderBom(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 从 BOM 行生成子工单（通知父组件） */
function handleGenerateWorkOrder(row: MesProWorkOrderBomApi.WorkOrderBom) {
  emit('generateWorkOrder', row);
}

/** 是否展示生成子工单按钮：已确认 + 自制 + 产品类型 BOM 行 */
function showGenerate(row: MesProWorkOrderBomApi.WorkOrderBom) {
  return (
    isConfirmed.value &&
    props.workOrder.type === MesProWorkOrderTypeEnum.SELF &&
    row.itemOrProduct === 'PRODUCT'
  );
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useBomGridColumns(isEditable.value, isConfirmed.value),
    height: 400,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.workOrderId) {
            return { list: [], total: 0 };
          }
          return await getWorkOrderBomPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            workOrderId: props.workOrderId,
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
    },
  } as VxeTableGridOptions<MesProWorkOrderBomApi.WorkOrderBom>,
});
</script>

<template>
  <div>
    <BomFormModal @success="handleRefresh" />
    <Grid table-title="工单 BOM">
      <template v-if="isEditable" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加物料',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              ifShow: isEditable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              ifShow: isEditable,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '生成工单',
              type: 'primary',
              link: true,
              ifShow: showGenerate(row),
              onClick: handleGenerateWorkOrder.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
