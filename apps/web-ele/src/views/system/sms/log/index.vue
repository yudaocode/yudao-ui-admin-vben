<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemSmsLogApi } from '#/api/system/sms/log';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportSmsLog, getSmsLogPage } from '#/api/system/sms/log';
import { $t } from '#/locales';

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
  downloadFileFromBlobPart({ fileName: '短信日志.xls', source: data });
}

/** 查看短信日志详情 */
function onDetail(row: SystemSmsLogApi.SmsLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemSmsLogApi.SmsLog>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemSmsLogApi.SmsLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="短信配置" url="https://doc.iocoder.cn/sms/" />
    </template>

    <DetailModal @success="onRefresh" />
    <Grid table-title="短信日志列表">
      <template #toolbar-tools>
        <ElButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:sms-log:export']"
        >
          <Download class="mr-2 size-5" />
          {{ $t('ui.actionTitle.export') }}
        </ElButton>
      </template>
    </Grid>
  </Page>
</template>
