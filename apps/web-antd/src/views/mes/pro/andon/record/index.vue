<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesProAndonRecordApi } from '#/api/mes/pro/andon/record';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { MesProAndonStatusEnum } from '@vben/constants';
import { downloadFileFromBlobPart } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAndonRecord,
  exportAndonRecord,
  getAndonRecordPage,
} from '#/api/mes/pro/andon/record';
import { $t } from '#/locales';

import ConfigList from '../config/modules/list.vue';
import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const configModalRef = ref<InstanceType<typeof ConfigList>>();

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增记录 */
function handleCreate() {
  formModalApi.setData({ formType: 'create' }).open();
}

/** 处置记录 */
function handleHandle(row: MesProAndonRecordApi.AndonRecord) {
  formModalApi.setData({ id: row.id, formType: 'update' }).open();
}

/** 详情 */
function handleDetail(row: MesProAndonRecordApi.AndonRecord) {
  formModalApi.setData({ id: row.id, formType: 'detail' }).open();
}

/** 删除 */
async function handleDelete(row: MesProAndonRecordApi.AndonRecord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.workstationName]),
    duration: 0,
  });
  try {
    await deleteAndonRecord(row.id!);
    message.success(
      $t('ui.actionMessage.deleteSuccess', [row.workstationName]),
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 导出 */
async function handleExport() {
  const data = await exportAndonRecord(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '安灯呼叫记录.xls', source: data });
}

/** 打开安灯设置弹窗 */
function handleOpenConfig() {
  configModalRef.value?.open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAndonRecordPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { isHover: true, keyField: 'id' },
    toolbarConfig: { refresh: true, search: true },
  } as VxeTableGridOptions<MesProAndonRecordApi.AndonRecord>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【生产】安灯配置、安灯呼叫"
        url="https://doc.iocoder.cn/mes/pro/andon/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <ConfigList ref="configModalRef" />
    <Grid table-title="安灯呼叫记录">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['安灯呼叫']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:pro-andon-record:create'],
              onClick: handleCreate,
            },
            {
              label: '安灯设置',
              type: 'primary',
              auth: ['mes:pro-andon-config:query'],
              onClick: handleOpenConfig,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['mes:pro-andon-record:export'],
              onClick: handleExport,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '处置',
              type: 'link',
              auth: ['mes:pro-andon-record:update'],
              ifShow: () => row.status === MesProAndonStatusEnum.ACTIVE,
              onClick: handleHandle.bind(null, row),
            },
            {
              label: '详情',
              type: 'link',
              auth: ['mes:pro-andon-record:query'],
              onClick: handleDetail.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['mes:pro-andon-record:delete'],
              ifShow: () => row.status === MesProAndonStatusEnum.ACTIVE,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.workstationName,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
