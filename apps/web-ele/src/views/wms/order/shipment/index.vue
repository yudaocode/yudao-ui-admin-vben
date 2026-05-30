<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsShipmentOrderApi } from '#/api/wms/order/shipment';
import type { WmsShipmentOrderDetailApi } from '#/api/wms/order/shipment/detail';

import { reactive, ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import {
  OrderDeleteStatusList,
  OrderStatusEnum,
  OrderUpdateStatusList,
} from '@vben/constants';
import { downloadFileFromBlobPart, formatDateTime } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import {
  ACTION_ICON,
  TableAction,
  useVbenVxeGrid,
  VxeColumn,
  VxeTable,
} from '#/adapter/vxe-table';
import {
  deleteShipmentOrder,
  exportShipmentOrder,
  getShipmentOrderDetailListByOrderId,
  getShipmentOrderPage,
} from '#/api/wms/order/shipment';
import { $t } from '#/locales';
import {
  formatPrice,
  formatQuantity,
  multiplyPrice,
} from '#/views/wms/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import ShipmentOrderDetail from './modules/detail.vue';
import ShipmentOrderForm from './modules/form.vue';
import ShipmentOrderPrint from './modules/print.vue';

defineOptions({ name: 'WmsShipmentOrder' });

const printRef = ref<InstanceType<typeof ShipmentOrderPrint>>();
const detailMap = reactive<
  Record<number, WmsShipmentOrderDetailApi.ShipmentOrderDetail[]>
>({});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ShipmentOrderForm,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ShipmentOrderDetail,
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

/** 创建出库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 编辑出库单 */
function handleEdit(row: WmsShipmentOrderApi.ShipmentOrder) {
  formModalApi.setData({ id: row.id!, formType: 'update' }).open();
}

/** 查看出库单详情 */
function handleDetail(row: WmsShipmentOrderApi.ShipmentOrder) {
  detailModalApi.setData({ id: row.id! }).open();
}

/** 计算单据明细金额 */
function getDetailTotalPrice(
  detail: WmsShipmentOrderDetailApi.ShipmentOrderDetail,
) {
  return detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price);
}

/** 获取已展开行的明细 */
function getExpandedDetails(row: WmsShipmentOrderApi.ShipmentOrder) {
  return detailMap[row.id!] || [];
}

/** 展开列表行时懒加载出库明细 */
async function handleExpandChange(
  row: WmsShipmentOrderApi.ShipmentOrder,
  expanded: boolean,
) {
  if (!expanded) {
    return;
  }
  delete detailMap[row.id!];
  detailMap[row.id!] = await getShipmentOrderDetailListByOrderId(row.id!);
}

/** 判断出库单是否可修改 */
function canUpdateShipmentOrder(status?: number) {
  return status !== undefined && OrderUpdateStatusList.includes(status);
}

/** 判断出库单是否可删除 */
function canDeleteShipmentOrder(status?: number) {
  return status !== undefined && OrderDeleteStatusList.includes(status);
}

/** 获取修改按钮禁用提示 */
function getShipmentOrderUpdateTip(status?: number) {
  if (canUpdateShipmentOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已出库，无法修改';
  }
  if (status === OrderStatusEnum.CANCELED) {
    return '已作废，无法修改';
  }
  return '当前状态无法修改';
}

/** 获取删除按钮禁用提示 */
function getShipmentOrderDeleteTip(status?: number) {
  if (canDeleteShipmentOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已出库，无法删除';
  }
  return '当前状态无法删除';
}

/** 删除出库单 */
async function handleDelete(row: WmsShipmentOrderApi.ShipmentOrder) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.no]),
  });
  try {
    await deleteShipmentOrder(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出出库单 */
async function handleExport() {
  const data = await exportShipmentOrder(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '出库单.xls', source: data });
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
          return await getShipmentOrderPage({
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
  } as VxeTableGridOptions<WmsShipmentOrderApi.ShipmentOrder>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: WmsShipmentOrderApi.ShipmentOrder;
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
        title="【单据】出库"
        url="https://doc.iocoder.cn/wms/order/shipment/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <DetailModal />
    <ShipmentOrderPrint ref="printRef" />

    <Grid table-title="出库单列表">
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
          <VxeColumn title="出库数量" align="right" width="120">
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
              label: $t('ui.actionTitle.create', ['出库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['wms:shipment-order:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['wms:shipment-order:export'],
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
        <div v-if="row.bizOrderNo" class="text-xs text-gray-500">
          业务：{{ row.bizOrderNo }}
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
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              disabled: !canUpdateShipmentOrder(row.status),
              tooltip: getShipmentOrderUpdateTip(row.status),
              auth: ['wms:shipment-order:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              disabled: !canDeleteShipmentOrder(row.status),
              tooltip: getShipmentOrderDeleteTip(row.status),
              auth: ['wms:shipment-order:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '打印',
              type: 'primary',
              link: true,
              auth: ['wms:shipment-order:query'],
              onClick: () => printRef?.print(row.id!),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
