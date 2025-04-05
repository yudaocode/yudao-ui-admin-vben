<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemSmsLogApi } from '#/api/system/sms/log';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { Button } from 'ant-design-vue';
import { DocAlert } from '#/components/doc-alert';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportSmsLog, getSmsLogPage } from '#/api/system/sms/log';
import { $t } from '#/locales';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 导出表格 */
async function onExport() {
  const data = await exportSmsLog(await gridApi.formApi.getValues());
  downloadByData(data, '短信日志.xls');
}

/** 查看短信日志详情 */
function onView(row: SystemSmsLogApi.SystemSmsLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemSmsLogApi.SystemSmsLog>) {
  switch (code) {
    case 'view': {
      onView(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getSmsLogPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<SystemSmsLogApi.SystemSmsLog>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="短信配置" url="https://doc.iocoder.cn/sms/" />

    <DetailModal @success="onRefresh" />
    <Grid table-title="短信日志列表">
      <template #toolbar-tools>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['system:sms-log:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
