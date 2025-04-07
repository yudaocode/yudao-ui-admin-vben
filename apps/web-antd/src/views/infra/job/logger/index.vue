<script lang="ts" setup>
import type { OnActionClickParams, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InfraJobLogApi } from '#/api/infra/job-log';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download } from '@vben/icons';
import { Button } from 'ant-design-vue';
import Detail from './modules/detail.vue';
import { DocAlert } from '#/components/doc-alert';

import { $t } from '#/locales';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { useRoute } from 'vue-router';
import { exportJobLog, getJobLogPage } from '#/api/infra/job-log';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';

const { query } = useRoute();

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 导出表格 */
async function onExport() {
  const data = await exportJobLog(await gridApi.formApi.getValues());
  downloadByData(data, '任务日志.xls');
}

/** 查看日志详情 */
function onDetail(row: InfraJobLogApi.InfraJobLog) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<InfraJobLogApi.InfraJobLog>) {
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
      refresh: { code: 'query' },
      search: true,
    },
  } as VxeTableGridOptions<InfraJobLogApi.InfraJobLog>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="定时任务" url="https://doc.iocoder.cn/job/" />
    <DocAlert title="异步任务" url="https://doc.iocoder.cn/async-task/" />
    <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />

    <DetailModal />
    <Grid table-title="任务日志列表">
      <template #toolbar-tools>
        <Button type="primary" class="ml-2" @click="onExport" v-access:code="['infra:job:export']">
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
