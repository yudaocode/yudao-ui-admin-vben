<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsMovementOrderApi } from '#/api/wms/order/movement';
import type { WmsMovementOrderDetailApi } from '#/api/wms/order/movement/detail';

import { reactive, ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import {
  OrderDeleteStatusList,
  OrderStatusEnum,
  OrderUpdateStatusList,
} from '@vben/constants';
import { downloadFileFromBlobPart, formatDateTime } from '@vben/utils';

import { message } from 'ant-design-vue';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
  VxeColumn,
  VxeTable,
} from '#/adapter/vxe-table';
import {
  deleteMovementOrder,
  exportMovementOrder,
  getMovementOrderDetailListByOrderId,
  getMovementOrderPage,
} from '#/api/wms/order/movement';
import { $t } from '#/locales';
import {
  formatPrice,
  formatQuantity,
  multiplyPrice,
} from '#/views/wms/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import MovementOrderDetail from './modules/detail.vue';
import MovementOrderForm from './modules/form.vue';
import MovementOrderPrint from './modules/print.vue';

defineOptions({ name: 'WmsMovementOrder' });

const printRef = ref<InstanceType<typeof MovementOrderPrint>>();
const detailMap = reactive<
  Record<number, WmsMovementOrderDetailApi.MovementOrderDetail[]>
>({});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: MovementOrderForm,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: MovementOrderDetail,
  destroyOnClose: true,
});

/** 清空展开明细缓存 */
function clearDetailMap() {
  for (const id of Object.keys(detailMap)) {
    delete detailMap[Number(id)];
  }
}

/** 刷新表格 */
function handleRefresh() {
  clearDetailMap();
  gridApi.query();
}

/** 创建移库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 编辑移库单 */
function handleEdit(row: WmsMovementOrderApi.MovementOrder) {
  formModalApi.setData({ id: row.id!, formType: 'update' }).open();
}

/** 查看移库单详情 */
function handleDetail(row: WmsMovementOrderApi.MovementOrder) {
  detailModalApi.setData({ id: row.id! }).open();
}

/** 计算单据明细金额 */
function getDetailTotalPrice(
  detail: WmsMovementOrderDetailApi.MovementOrderDetail,
) {
  return detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price);
}

/** 获取已展开行的明细 */
function getExpandedDetails(row: WmsMovementOrderApi.MovementOrder) {
  return detailMap[row.id!] || [];
}

/** 展开列表行时懒加载移库明细 */
async function handleExpandChange(
  row: WmsMovementOrderApi.MovementOrder,
  expanded: boolean,
) {
  if (!expanded) {
    return;
  }
  delete detailMap[row.id!];
  detailMap[row.id!] = await getMovementOrderDetailListByOrderId(row.id!);
}

/** 判断移库单是否可修改 */
function canUpdateMovementOrder(status?: number) {
  return status !== undefined && OrderUpdateStatusList.includes(status);
}

/** 判断移库单是否可删除 */
function canDeleteMovementOrder(status?: number) {
  return status !== undefined && OrderDeleteStatusList.includes(status);
}

/** 获取修改按钮禁用提示 */
function getMovementOrderUpdateTip(status?: number) {
  if (canUpdateMovementOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已移库，无法修改';
  }
  if (status === OrderStatusEnum.CANCELED) {
    return '已作废，无法修改';
  }
  return '当前状态无法修改';
}

/** 获取删除按钮禁用提示 */
function getMovementOrderDeleteTip(status?: number) {
  if (canDeleteMovementOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已移库，无法删除';
  }
  return '当前状态无法删除';
}

/** 删除移库单 */
async function handleDelete(row: WmsMovementOrderApi.MovementOrder) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.no]),
    duration: 0,
  });
  try {
    await deleteMovementOrder(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出移库单 */
async function handleExport() {
  const data = await exportMovementOrder(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '移库单.xls', source: data });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    collapsed: true,
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    expandConfig: {
      padding: true,
    },
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getMovementOrderPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      isHover: true,
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<WmsMovementOrderApi.MovementOrder>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: WmsMovementOrderApi.MovementOrder;
    }) => {
      handleExpandChange(row, expanded);
    },
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【单据】移库"
        url="https://doc.iocoder.cn/wms/order/movement/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <DetailModal />
    <MovementOrderPrint ref="printRef" />

    <Grid table-title="移库单列表">
      <template #expand_content="{ row }">
        <VxeTable
          :data="getExpandedDetails(row)"
          border
          :show-overflow="true"
          size="small"
        >
          <VxeColumn title="商品信息" min-width="220">
            <template #default="{ row: detail }">
              <div>{{ detail.itemName || '-' }}</div>
              <div v-if="detail.itemCode" class="text-xs text-gray-500">
                商品编号：{{ detail.itemCode }}
              </div>
            </template>
          </VxeColumn>
          <VxeColumn title="规格信息" min-width="220">
            <template #default="{ row: detail }">
              <div>{{ detail.skuName || '-' }}</div>
              <div v-if="detail.skuCode" class="text-xs text-gray-500">
                规格编号：{{ detail.skuCode }}
              </div>
            </template>
          </VxeColumn>
          <VxeColumn title="移库数量" align="right" width="120">
            <template #default="{ row: detail }">
              {{ formatQuantity(detail.quantity) }}
            </template>
          </VxeColumn>
          <VxeColumn title="单价(元)" align="right" width="120">
            <template #default="{ row: detail }">
              {{ formatPrice(detail.price) || '-' }}
            </template>
          </VxeColumn>
          <VxeColumn title="金额(元)" align="right" width="120">
            <template #default="{ row: detail }">
              {{ formatPrice(getDetailTotalPrice(detail)) || '-' }}
            </template>
          </VxeColumn>
        </VxeTable>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['移库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['wms:movement-order:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['wms:movement-order:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #no="{ row }">
        <div>
          单号：
          <a class="text-primary" @click="handleDetail(row)">{{ row.no }}</a>
        </div>
      </template>
      <template #quantityAmount="{ row }">
        <div class="flex items-center justify-between">
          <span>数量：</span>
          <span>{{ formatQuantity(row.totalQuantity) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span>金额：</span>
          <span>{{ formatPrice(row.totalPrice) }}</span>
        </div>
      </template>
      <template #operateInfo="{ row }">
        <div>
          创建：{{ formatDateTime(row.createTime) || '-' }} /
          {{ row.creatorName || row.creator || '-' }}
        </div>
        <div>
          更新：{{ formatDateTime(row.updateTime) || '-' }} /
          {{ row.updaterName || row.updater || '-' }}
        </div>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              disabled: !canUpdateMovementOrder(row.status),
              tooltip: getMovementOrderUpdateTip(row.status),
              auth: ['wms:movement-order:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: !canDeleteMovementOrder(row.status),
              tooltip: getMovementOrderDeleteTip(row.status),
              auth: ['wms:movement-order:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '打印',
              type: 'link',
              auth: ['wms:movement-order:query'],
              onClick: () => printRef?.print(row.id!),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
