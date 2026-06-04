<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WmsCheckOrderApi } from '#/api/wms/order/check';
import type { WmsCheckOrderDetailApi } from '#/api/wms/order/check/detail';

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
  deleteCheckOrder,
  exportCheckOrder,
  getCheckOrderDetailListByOrderId,
  getCheckOrderPage,
} from '#/api/wms/order/check';
import { $t } from '#/locales';
import {
  formatPrice,
  formatQuantity,
  getLossClass,
} from '#/views/wms/utils/format';

import {
  getDetailActualPrice,
  getDetailDifferencePrice,
  getDetailDifferenceQuantity,
  getOrderDifferencePrice,
  useGridColumns,
  useGridFormSchema,
} from './data';
import CheckOrderDetail from './modules/detail.vue';
import CheckOrderForm from './modules/form.vue';
import CheckOrderPrint from './modules/print.vue';

defineOptions({ name: 'WmsCheckOrder' });

const printRef = ref<InstanceType<typeof CheckOrderPrint>>();
const detailMap = reactive<
  Record<number, WmsCheckOrderDetailApi.CheckOrderDetail[]>
>({});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: CheckOrderForm,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: CheckOrderDetail,
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

/** 创建盘库单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 编辑盘库单 */
function handleEdit(row: WmsCheckOrderApi.CheckOrder) {
  formModalApi.setData({ id: row.id!, formType: 'update' }).open();
}

/** 查看盘库单详情 */
function handleDetail(row: WmsCheckOrderApi.CheckOrder) {
  detailModalApi.setData({ id: row.id! }).open();
}

/** 获取已展开行的明细 */
function getExpandedDetails(row: WmsCheckOrderApi.CheckOrder) {
  return detailMap[row.id!] || [];
}

/** 展开列表行时懒加载盘库明细 */
async function handleExpandChange(
  row: WmsCheckOrderApi.CheckOrder,
  expanded: boolean,
) {
  if (!expanded) {
    return;
  }
  delete detailMap[row.id!];
  detailMap[row.id!] = await getCheckOrderDetailListByOrderId(row.id!);
}

/** 判断盘库单是否可修改 */
function canUpdateCheckOrder(status?: number) {
  return status !== undefined && OrderUpdateStatusList.includes(status);
}

/** 判断盘库单是否可删除 */
function canDeleteCheckOrder(status?: number) {
  return status !== undefined && OrderDeleteStatusList.includes(status);
}

/** 获取修改按钮禁用提示 */
function getCheckOrderUpdateTip(status?: number) {
  if (canUpdateCheckOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已盘库，无法修改';
  }
  if (status === OrderStatusEnum.CANCELED) {
    return '已作废，无法修改';
  }
  return '当前状态无法修改';
}

/** 获取删除按钮禁用提示 */
function getCheckOrderDeleteTip(status?: number) {
  if (canDeleteCheckOrder(status)) {
    return undefined;
  }
  if (status === OrderStatusEnum.FINISHED) {
    return '已盘库，无法删除';
  }
  return '当前状态无法删除';
}

/** 删除盘库单 */
async function handleDelete(row: WmsCheckOrderApi.CheckOrder) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.no]),
  });
  try {
    await deleteCheckOrder(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.no]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 导出盘库单 */
async function handleExport() {
  const data = await exportCheckOrder(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '盘库单.xls', source: data });
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
          return await getCheckOrderPage({
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
  } as VxeTableGridOptions<WmsCheckOrderApi.CheckOrder>,
  gridEvents: {
    toggleRowExpand: ({
      expanded,
      row,
    }: {
      expanded: boolean;
      row: WmsCheckOrderApi.CheckOrder;
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
        title="【单据】盘库"
        url="https://doc.iocoder.cn/wms/order/check/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <DetailModal />
    <CheckOrderPrint ref="printRef" />

    <Grid table-title="盘库单列表">
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
          <VxeColumn title="账面数量" align="right" width="120">
            <template #default="{ row: detail }">
              {{ formatQuantity(detail.quantity) }}
            </template>
          </VxeColumn>
          <VxeColumn title="实盘数量" align="right" width="120">
            <template #default="{ row: detail }">
              {{ formatQuantity(detail.checkQuantity) }}
            </template>
          </VxeColumn>
          <VxeColumn title="单价(元)" align="right" width="120">
            <template #default="{ row: detail }">
              {{ formatPrice(detail.price) || '-' }}
            </template>
          </VxeColumn>
          <VxeColumn title="实际金额(元)" align="right" width="140">
            <template #default="{ row: detail }">
              {{ formatPrice(getDetailActualPrice(detail)) || '-' }}
            </template>
          </VxeColumn>
          <VxeColumn title="盈亏数量" align="right" width="120">
            <template #default="{ row: detail }">
              <span :class="getLossClass(getDetailDifferenceQuantity(detail))">
                {{ formatQuantity(getDetailDifferenceQuantity(detail)) }}
              </span>
            </template>
          </VxeColumn>
          <VxeColumn title="实际盈亏金额(元)" align="right" width="160">
            <template #default="{ row: detail }">
              <span :class="getLossClass(getDetailDifferencePrice(detail))">
                {{ formatPrice(getDetailDifferencePrice(detail)) || '-' }}
              </span>
            </template>
          </VxeColumn>
        </VxeTable>
      </template>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['盘库单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['wms:check-order:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['wms:check-order:export'],
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
          <span>盈亏数：</span>
          <span :class="getLossClass(row.totalQuantity)">
            {{ formatQuantity(row.totalQuantity) }}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span>总金额：</span>
          <span>{{ formatPrice(row.totalPrice) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span>实际金额：</span>
          <span>{{ formatPrice(row.actualPrice) }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span>盈亏金额：</span>
          <span :class="getLossClass(getOrderDifferencePrice(row))">
            {{ formatPrice(getOrderDifferencePrice(row)) }}
          </span>
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
              disabled: !canUpdateCheckOrder(row.status),
              tooltip: getCheckOrderUpdateTip(row.status),
              auth: ['wms:check-order:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              disabled: !canDeleteCheckOrder(row.status),
              tooltip: getCheckOrderDeleteTip(row.status),
              auth: ['wms:check-order:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '打印',
              type: 'primary',
              link: true,
              auth: ['wms:check-order:query'],
              onClick: () => printRef?.print(row.id!),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
