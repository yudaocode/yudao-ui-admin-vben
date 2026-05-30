<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProWorkOrderApi } from '#/api/mes/pro/workorder';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import {
  BarcodeBizTypeEnum,
  MesProWorkOrderStatusEnum,
  MesProWorkOrderTypeEnum,
} from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelWorkOrder,
  deleteWorkOrder,
  exportWorkOrder,
  getWorkOrderPage,
} from '#/api/mes/pro/workorder';
import { $t } from '#/locales';
import { BarcodeDetail } from '#/views/mes/wm/barcode/components';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const barcodeDetailRef = ref<InstanceType<typeof BarcodeDetail>>(); // 条码详情弹窗

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建工单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 新增子工单 */
function handleAddChild(row: MesProWorkOrderApi.WorkOrder) {
  formModalApi.setData({ formType: 'create', parentRow: row }).open();
}

/** 查看工单详情 */
function handleDetail(row: MesProWorkOrderApi.WorkOrder) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑工单 */
function handleEdit(row: MesProWorkOrderApi.WorkOrder) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 完成工单 */
function handleFinish(row: MesProWorkOrderApi.WorkOrder) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除工单 */
async function handleDelete(row: MesProWorkOrderApi.WorkOrder) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteWorkOrder(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消工单 */
async function handleCancel(row: MesProWorkOrderApi.WorkOrder) {
  await cancelWorkOrder(row.id!);
  message.success('工单已取消');
  handleRefresh();
}

/** 查看工单条码 */
function handleBarcode(row: MesProWorkOrderApi.WorkOrder) {
  barcodeDetailRef.value?.openByBusiness(
    row.id!,
    BarcodeBizTypeEnum.WORKORDER,
    row.code,
    row.name,
  );
}

/** 导出表格 */
async function handleExport() {
  const data = await exportWorkOrder(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '生产工单.xls', source: data });
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
          return await getWorkOrderPage({
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
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
      expandAll: true,
      reserve: true,
    },
  } as VxeTableGridOptions<MesProWorkOrderApi.WorkOrder>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】生产工单"
        url="https://doc.iocoder.cn/mes/pro/work-order/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="生产工单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['工单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:pro-work-order:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:pro-work-order:export'],
              onClick: handleExport,
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
              auth: ['mes:pro-work-order:update'],
              ifShow: row.status === MesProWorkOrderStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:pro-work-order:delete'],
              ifShow: row.status === MesProWorkOrderStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: $t('common.create'),
              type: 'link',
              auth: ['mes:pro-work-order:create'],
              ifShow:
                row.status === MesProWorkOrderStatusEnum.CONFIRMED &&
                row.type === MesProWorkOrderTypeEnum.SELF,
              onClick: handleAddChild.bind(null, row),
            },
            {
              label: '完成',
              type: 'link',
              auth: ['mes:pro-work-order:update'],
              ifShow: row.status === MesProWorkOrderStatusEnum.CONFIRMED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:pro-work-order:update'],
              ifShow: row.status === MesProWorkOrderStatusEnum.CONFIRMED,
              popConfirm: {
                title: '确认要取消该工单吗？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
            {
              label: '条码',
              type: 'link',
              auth: ['mes:pro-work-order:query'],
              onClick: handleBarcode.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
    <BarcodeDetail ref="barcodeDetailRef" />
  </Page>
</template>
