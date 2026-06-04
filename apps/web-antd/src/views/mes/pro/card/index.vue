<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProCardApi } from '#/api/mes/pro/card';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesProCardStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { Button, message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelCard,
  deleteCard,
  exportCard,
  getCardPage,
} from '#/api/mes/pro/card';
import { $t } from '#/locales';
import { PrinterLabel } from '#/views/mes/wm/barcode/components';

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

/** 创建流转卡 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 查看流转卡详情 */
function handleDetail(row: MesProCardApi.Card) {
  formModalApi.setData({ formType: 'detail', id: row.id }).open();
}

/** 编辑流转卡 */
function handleEdit(row: MesProCardApi.Card) {
  formModalApi.setData({ formType: 'update', id: row.id }).open();
}

/** 完成流转卡 */
function handleFinish(row: MesProCardApi.Card) {
  formModalApi.setData({ formType: 'finish', id: row.id }).open();
}

/** 删除流转卡 */
async function handleDelete(row: MesProCardApi.Card) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.code]),
    duration: 0,
  });
  try {
    await deleteCard(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 取消流转卡 */
async function handleCancel(row: MesProCardApi.Card) {
  await cancelCard(row.id!);
  message.success('取消成功');
  handleRefresh();
}

/** 导出表格 */
async function handleExport() {
  const data = await exportCard(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '生产流转卡.xls', source: data });
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
          return await getCardPage({
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
  } as VxeTableGridOptions<MesProCardApi.Card>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】生产排产、工序流转卡"
        url="https://doc.iocoder.cn/mes/pro/schedule-card/"
      />
    </template>

    <FormModal @success="handleRefresh" />

    <Grid table-title="生产流转卡列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['流转卡']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:pro-card:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:pro-card:export'],
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
              auth: ['mes:pro-card:update'],
              ifShow: row.status === MesProCardStatusEnum.PREPARE,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:pro-card:delete'],
              ifShow: row.status === MesProCardStatusEnum.PREPARE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
            {
              label: '完成',
              type: 'link',
              auth: ['mes:pro-card:finish'],
              ifShow: row.status === MesProCardStatusEnum.CONFIRMED,
              onClick: handleFinish.bind(null, row),
            },
            {
              label: '取消',
              type: 'link',
              danger: true,
              auth: ['mes:pro-card:update'],
              ifShow: row.status === MesProCardStatusEnum.CONFIRMED,
              popConfirm: {
                title: '确认取消该流转卡？取消后不可恢复。',
                confirm: handleCancel.bind(null, row),
              },
            },
          ]"
        />
        <PrinterLabel :biz-code="row.code" :biz-id="row.id" biz-type="PROCARD" />
      </template>
    </Grid>
  </Page>
</template>
