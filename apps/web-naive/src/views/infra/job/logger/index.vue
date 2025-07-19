<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraJobLogApi } from '#/api/infra/job-log';

import { useRoute } from 'vue-router';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { downloadFileFromBlobPart } from '@vben/utils';

import { NButton } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { exportJobLog, getJobLogPage } from '#/api/infra/job-log';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';

const { query } = useRoute();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 导出表格 */
async function onExport() {
  const data = await exportJobLog(await gridApi.formApi.getValues());
  downloadFileFromBlobPart({ fileName: '任务日志.xls', source: data });
}

/** 查看日志详情 */
function onDetail(row: InfraJobLogApi.JobLog) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraJobLogApi.JobLog>) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
  }
}

// 获取表单schema并设置默认jobId
const formSchema = useGridFormSchema();

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: formSchema,
  },
  gridOptions: {
    columns: useGridColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getJobLogPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            jobId: query.id,
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
  } as VxeTableGridOptions<InfraJobLogApi.JobLog>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="定时任务" url="https://doc.iocoder.cn/job/" />
      <DocAlert title="异步任务" url="https://doc.iocoder.cn/async-task/" />
      <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />
    </template>

    <DetailModal />
    <Grid table-title="任务日志列表">
      <template #toolbar-tools>
        <NButton
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:job:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </NButton>
      </template>
    </Grid>
  </Page>
</template>
