<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmArrivalNoticeApi } from '#/api/mes/wm/arrivalnotice';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesWmArrivalNoticeStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton, ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteArrivalNotice,
  exportArrivalNotice,
  getArrivalNoticePage,
} from '#/api/mes/wm/arrivalnotice';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建到货通知单 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看到货通知单 */
function handleDetail(row: MesWmArrivalNoticeApi.ArrivalNotice) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑到货通知单 */
function handleEdit(row: MesWmArrivalNoticeApi.ArrivalNotice) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 删除到货通知单 */
async function handleDelete(row: MesWmArrivalNoticeApi.ArrivalNotice) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteArrivalNotice(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 提示前往质检模块 */
function handleQc() {
  ElMessage.info('请前往【质量管理 - 待检任务】中进行来料检验操作');
}

/** 提示前往采购入库模块 */
function handleReceipt() {
  ElMessage.info('请前往【仓库管理 - 采购入库】中进行入库操作');
}

/** 导出表格 */
async function handleExport() {
  const data = await exportArrivalNotice(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '到货通知单.xls', source: data });
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
          return await getArrivalNoticePage({
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
  } as VxeTableGridOptions<MesWmArrivalNoticeApi.ArrivalNotice>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【仓库】到货通知、采购入库、采购退货"
        url="https://doc.iocoder.cn/mes/wm/purchase-in/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="到货通知单列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['到货通知单']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:wm-arrival-notice:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:wm-arrival-notice:export'],
              onClick: handleExport,
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
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['mes:wm-arrival-notice:update'],
              ifShow: row.status === MesWmArrivalNoticeStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:wm-arrival-notice:delete'],
              ifShow: row.status === MesWmArrivalNoticeStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '执行质检',
              type: 'primary',
              link: true,
              ifShow: row.status === MesWmArrivalNoticeStatusEnum.PENDING_QC,
              onClick: handleQc,
            },
            {
              label: '执行入库',
              type: 'primary',
              link: true,
              ifShow:
                row.status === MesWmArrivalNoticeStatusEnum.PENDING_RECEIPT,
              onClick: handleReceipt,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
