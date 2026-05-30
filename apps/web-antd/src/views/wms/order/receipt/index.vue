<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsReceiptOrderApi } from '#/api/wms/order/receipt';
import type { WmsReceiptOrderDetailApi } from '#/api/wms/order/receipt/detail';

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
  deleteReceiptOrder,
  exportReceiptOrder,
  getReceiptOrderDetailListByOrderId,
  getReceiptOrderPage,
} from '#/api/wms/order/receipt';
import { $t } from '#/locales';
import {
  formatPrice,
  formatQuantity,
  multiplyPrice,
} from '#/views/wms/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import ReceiptOrderDetail from './modules/detail.vue';
import ReceiptOrderForm from './modules/form.vue';
import ReceiptOrderPrint from './modules/print.vue';

defineOptions({ name: 'WmsReceiptOrder' });

const printRef = ref<InstanceType<typeof ReceiptOrderPrint>>();
const detailMap = reactive<
  Record<number, WmsReceiptOrderDetailApi.ReceiptOrderDetail[]>
>({});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ReceiptOrderForm,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ReceiptOrderDetail,
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

/** 创建入库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 编辑入库单 */
function handleEdit(row: WmsReceiptOrderApi.ReceiptOrder) {
  formModalApi.setData({ id: row.id!, formType: 'update' }).open();
}

/** 查看入库单详情 */
function handleDetail(row: WmsReceiptOrderApi.ReceiptOrder) {
  detailModalApi.setData({ id: row.id! }).open();
}

/** 计算单据明细金额 */
function getDetailTotalPrice(
  detail: WmsReceiptOrderDetailApi.ReceiptOrderDetail,
) {
  return detail.totalPrice ?? multiplyPrice(detail.quantity, detail.price);
}

/** 获取已展开行的明细 */
function getExpandedDetails(row: WmsReceiptOrderApi.ReceiptOrder) {
  return detailMap[row.id!] || [];
}

/** 展开列表行时懒加载入库明细 */
async function handleExpandChange(
  row: WmsReceiptOrderApi.ReceiptOrder,
  expanded: boolean,
) {
  if (!expanded) {
    return;
  }
  delete detailMap[row.id!];
  detailMap[row.id!] = await getReceiptOrderDetailListByOrderId(row.id!);
}

/** 判断入库单是否可修改 */
function canUpdateReceiptOrder(status?: number) {
  return status !== undefined && OrderUpdateStatusList.includes(status);
}

/** 判断入库单是否可删除 */
function canDeleteReceiptOrder(status?: number) {
  return status !== undefined && OrderDeleteStatusList.includes(status);
}

/** 获取修改按钮禁用提示 */
function getReceiptOrderUpdateTip(status?: number) {
  if (canUpdateReceiptOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已入库，无法修改';
  }
  if (status === OrderStatusEnum.CANCELED) {
    return '已作废，无法修改';
  }
  return '当前状态无法修改';
}

/** 获取删除按钮禁用提示 */
function getReceiptOrderDeleteTip(status?: number) {
  if (canDeleteReceiptOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已入库，无法删除';
  }
  return '当前状态无法删除';
}

/** 删除入库单 */
async function handleDelete(row: WmsReceiptOrderApi.ReceiptOrder) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.no]),
    duration: 0,
  });
  try {
    await deleteReceiptOrder(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出入库单 */
async function handleExport() {
  const data = await exportReceiptOrder(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '入库单.xls', source: data });
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
          return await getReceiptOrderPage({
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
  } as VxeTableGridOptions<WmsReceiptOrderApi.ReceiptOrder>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: WmsReceiptOrderApi.ReceiptOrder;
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
        title="【单据】入库"
        url="https://doc.iocoder.cn/wms/order/receipt/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <DetailModal />
    <ReceiptOrderPrint ref="printRef" />

    <Grid table-title="入库单列表">
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
          <VxeColumn title="入库数量" align="right" width="120">
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
              label: $t('ui.actionTitle.create', ['入库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['wms:receipt-order:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['wms:receipt-order:export'],
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
              type: 'link',
              icon: ACTION_ICON.EDIT,
              disabled: !canUpdateReceiptOrder(row.status),
              tooltip: getReceiptOrderUpdateTip(row.status),
              auth: ['wms:receipt-order:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              disabled: !canDeleteReceiptOrder(row.status),
              tooltip: getReceiptOrderDeleteTip(row.status),
              auth: ['wms:receipt-order:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '打印',
              type: 'link',
              auth: ['wms:receipt-order:query'],
              onClick: () => printRef?.print(row.id!),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
