<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemLoginLogApi } from '#/api/system/login-log';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { Button } from 'ant-design-vue';
import { DocAlert } from '#/components/doc-alert';
import Detail from './modules/detail.vue';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportLoginLog, getLoginLogPage } from '#/api/system/login-log';
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
  const data = await exportLoginLog(await gridApi.formApi.getValues());
  downloadByData(data, '登录日志.xls');
}

/** 查看登录日志详情 */
function onView(row: SystemLoginLogApi.SystemLoginLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemLoginLogApi.SystemLoginLog>) {
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
          return await getLoginLogPage({
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
  } as VxeTableGridOptions<SystemLoginLogApi.SystemLoginLog>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />

    <DetailModal @success="onRefresh" />
    <Grid table-title="登录日志列表">
      <template #toolbar-tools>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['system:login-log:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>