<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraApiErrorLogApi } from '#/api/infra/api-error-log';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  exportApiErrorLog,
  getApiErrorLogPage,
  updateApiErrorLogStatus,
} from '#/api/infra/api-error-log';
import { DocAlert } from '#/components/doc-alert';
import { $t } from '#/locales';
import { InfraApiErrorLogProcessStatusEnum } from '#/utils/constants';
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
  const data = await exportApiErrorLog(await gridApi.formApi.getValues());
  downloadByData(data, 'API 错误日志.xls');
}

/** 查看 API 错误日志详情 */
function onDetail(row: InfraApiErrorLogApi.ApiErrorLog) {
  detailModalApi.setData(row).open();
}

/** 处理已处理 / 已忽略的操作 */
async function onProcess(id: number, processStatus: number) {
  Modal.confirm({
    title: '确认操作',
    content: `确认标记为${InfraApiErrorLogProcessStatusEnum.DONE ? '已处理' : '已忽略'}?`,
    onOk: async () => {
      await updateApiErrorLogStatus(id, processStatus);
      // 关闭并提示
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
      onRefresh();
    },
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
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<InfraApiErrorLogApi.ApiErrorLog>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="系统日志" url="https://doc.iocoder.cn/system-log/" />

    <DetailModal @success="onRefresh" />
    <Grid table-title="API 错误日志列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:api-error-log:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
