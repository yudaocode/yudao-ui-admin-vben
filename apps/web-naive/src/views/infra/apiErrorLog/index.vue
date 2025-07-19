<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton } from 'naive-ui';

import { message } from '#/adapter/naive';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportApiErrorLog,
  getApiErrorLogPage,
  updateApiErrorLogStatus,
} from '#/api/infra/api-error-log';
import { $t } from '#/locales';
import { InfraApiErrorLogProcessStatusEnum } from '#/utils';

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
  const data = await exportApiErrorLog(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: 'API 错误日志.xls', source: data });
}

/** 查看 API 错误日志详情 */
function onDetail(row: InfraApiErrorLogApi.ApiErrorLog) {
  detailModalApi.setData(row).open();
}

/** 处理已处理 / 已忽略的操作 */
async function onProcess(id: number, processStatus: number) {
  confirm({
    content: `确认标记为${InfraApiErrorLogProcessStatusEnum.DONE ? '已处理' : '已忽略'}?`,
  }).then(async () => {
    await updateApiErrorLogStatus(id, processStatus);
    // 关闭并提示
    message.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  });
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraApiErrorLogApi.ApiErrorLog>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'done': {
      onProcess(row.id, InfraApiErrorLogProcessStatusEnum.DONE);
      break;
    }
    case 'ignore': {
      onProcess(row.id, InfraApiErrorLogProcessStatusEnum.IGNORE);
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
          return await getApiErrorLogPage({
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
  } as VxeTableGridOptions<InfraApiErrorLogApi.ApiErrorLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />
    </template>

    <DetailModal @success="onRefresh" />
    <Grid table-title="API 错误日志列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:api-error-log:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
