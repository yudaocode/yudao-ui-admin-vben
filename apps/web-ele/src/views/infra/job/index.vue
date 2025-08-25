<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { InfraJobApi } from '#/api/infra/job';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { downloadFileFromBlobPart, isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteJob,
  deleteJobList,
  exportJob,
  getJobPage,
  runJob,
  updateJobStatus,
} from '#/api/infra/job';
import { $t } from '#/locales';
import { InfraJobStatusEnum } from '#/utils';

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
  downloadFileFromBlobPart({ fileName: '定时任务.xls', source: data });
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

  confirm({
    content: `确定${statusText} ${row.name} 吗？`,
  }).then(async () => {
    await updateJobStatus(row.id as number, status);
    // 提示成功
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
    onRefresh();
  });
}

/** 执行一次任务 */
async function onTrigger(row: InfraJobApi.Job) {
  confirm({
    content: `确定执行一次 ${row.name} 吗？`,
  }).then(async () => {
    await runJob(row.id as number);
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
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
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
    fullscreen: true,
  });
  try {
    await deleteJob(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除任务 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该任务吗？');
  await deleteJobList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({ records }: { records: InfraJobApi.Job[] }) {
  checkedIds.value = records.map((item) => item.id as number);
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
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<InfraJobApi.Job>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert title="定时任务" url="https://doc.iocoder.cn/job/" />
      <DocAlert title="异步任务" url="https://doc.iocoder.cn/async-task/" />
      <DocAlert title="消息队列" url="https://doc.iocoder.cn/message-queue/" />
    </template>

    <FormModal @success="onRefresh" />
    <DetailModal />
    <Grid table-title="定时任务列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['任务']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['infra:job:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.export'),
              type: 'primary',
              icon: ACTION_ICON.DOWNLOAD,
              auth: ['infra:job:export'],
              onClick: onExport,
            },
            {
              label: '执行日志',
              type: 'primary',
              icon: ACTION_ICON.MORE,
              auth: ['infra:job:query'],
              onClick: () => onLog(undefined),
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['infra:job:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
