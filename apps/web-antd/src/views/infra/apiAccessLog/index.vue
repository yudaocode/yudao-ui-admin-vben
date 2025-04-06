<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraApiAccessLogApi } from '#/api/infra/api-access-log';

import { Page, useVbenModal } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { Download } from '@vben/icons';
import Detail from './modules/detail.vue';
import { DocAlert } from '#/components/doc-alert';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportApiAccessLog, getApiAccessLogPage } from '#/api/infra/api-access-log';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';

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
  const data = await exportApiAccessLog(await gridApi.formApi.getValues());
  downloadByData(data, 'API 访问日志.xls');
}

/** 查看 API 访问日志详情 */
function onView(row: InfraApiAccessLogApi.SystemApiAccessLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraApiAccessLogApi.SystemApiAccessLog>) {
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
          return await getApiAccessLogPage({
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
  } as VxeTableGridOptions<InfraApiAccessLogApi.SystemApiAccessLog>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />

    <DetailModal @success="onRefresh" />
    <Grid table-title="API 访问日志列表">
      <template #toolbar-tools>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['infra:api-access-log:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>