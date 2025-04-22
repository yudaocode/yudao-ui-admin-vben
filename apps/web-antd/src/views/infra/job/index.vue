<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraJobApi } from '#/api/infra/job';

import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, History, Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteJob,
  exportJob,
  getJobPage,
  runJob,
  updateJobStatus,
} from '#/api/infra/job';
import { DocAlert } from '#/components/doc-alert';
import { $t } from '#/locales';
import { InfraJobStatusEnum } from '#/utils/constants';
import { downloadByData } from '#/utils/download';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

const { push } = useRouter();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

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
  const data = await exportJob(await gridApi.formApi.getValues());
  downloadByData(data, '定时任务.xls');
}

/** 创建任务 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑任务 */
function onEdit(row: InfraJobApi.Job) {
  formModalApi.setData(row).open();
}

/** 查看任务详情 */
function onDetail(row: InfraJobApi.Job) {
  detailModalApi.setData({ id: row.id }).open();
}

/** 更新任务状态 */
async function onUpdateStatus(row: InfraJobApi.Job) {
  const status =
    row.status === InfraJobStatusEnum.STOP
      ? InfraJobStatusEnum.NORMAL
      : InfraJobStatusEnum.STOP;
  const statusText = status === InfraJobStatusEnum.NORMAL ? '启用' : '停用';
  Modal.confirm({
    title: '确认操作',
    content: `确定${statusText} ${row.name} 吗？`,
    onOk: async () => {
      await updateJobStatus(row.id as number, status);
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
      onRefresh();
    },
  });
}

/** 执行一次任务 */
async function onTrigger(row: InfraJobApi.Job) {
  Modal.confirm({
    title: '确认操作',
    content: `确定执行一次 ${row.name} 吗？`,
    onOk: async () => {
      await runJob(row.id as number);
      message.success({
        content: $t('ui.actionMessage.operationSuccess'),
        key: 'action_process_msg',
      });
    },
  });
}

/** 跳转到任务日志 */
function onLog(row?: InfraJobApi.Job) {
  push({
    name: 'InfraJobLog',
    query: row?.id ? { id: row.id } : {},
  });
}

/** 删除任务 */
async function onDelete(row: InfraJobApi.Job) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  try {
    await deleteJob(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_process_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({ code, row }: OnActionClickParams<InfraJobApi.Job>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'log': {
      onLog(row);
      break;
    }
    case 'trigger': {
      onTrigger(row);
      break;
    }
    case 'update-status': {
      onUpdateStatus(row);
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
          return await getJobPage({
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
  } as VxeTableGridOptions<InfraJobApi.Job>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="定时任务" url="https://doc.iocoder.cn/job/" />
    <DocAlert title="异步任务" url="https://doc.iocoder.cn/async-task/" />
    <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />

    <FormModal @success="onRefresh" />
    <DetailModal />
    <Grid table-title="定时任务列表">
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="onCreate"
          v-access:code="['infra:job:create']"
        >
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', ['任务']) }}
        </Button>
        <Button
          type="primary"
          class="ml-2"
          @click="onExport"
          v-access:code="['infra:job:export']"
        >
          <Download class="size-5" />
          {{ $t('ui.actionTitle.export') }}
        </Button>
        <Button
          type="primary"
          class="ml-2"
          @click="onLog(undefined)"
          v-access:code="['infra:job:query']"
        >
          <History class="size-5" />
          执行日志
        </Button>
      </template>
    </Grid>
  </Page>
</template>
