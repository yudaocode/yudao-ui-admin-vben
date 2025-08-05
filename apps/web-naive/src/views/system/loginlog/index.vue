<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemLoginLogApi } from '#/api/system/login-log';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportLoginLog, getLoginLogPage } from '#/api/system/login-log';
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
  const data = await exportLoginLog(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '登录日志.xls', source: data });
}

/** 查看登录日志详情 */
function onDetail(row: SystemLoginLogApi.LoginLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemLoginLogApi.LoginLog>) {
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<SystemLoginLogApi.LoginLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />
    </template>

    <DetailModal @success="onRefresh" />
    <Grid table-title="登录日志列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:login-log:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
