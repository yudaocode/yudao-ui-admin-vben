<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemOperateLogApi } from '#/api/system/operate-log';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';

import { Button } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportOperateLog, getOperateLogPage } from '#/api/system/operate-log';
import { DocAlert } from '#/components/doc-alert';
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
  const data = await exportOperateLog(await gridApi.formApi.getValues());
  downloadByData(data, '操作日志.xls');
}

/** 查看操作日志详情 */
function onDetail(row: SystemOperateLogApi.SystemOperateLog) {
  detailModalApi.setData(row).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemOperateLogApi.SystemOperateLog>) {
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
          return await getOperateLogPage({
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
  } as VxeTableGridOptions<SystemOperateLogApi.SystemOperateLog>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />

    <DetailModal @success="onRefresh" />
    <Grid table-title="操作日志列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['system:operate-log:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
