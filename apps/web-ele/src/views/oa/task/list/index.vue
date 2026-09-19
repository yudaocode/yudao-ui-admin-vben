<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaTaskApi } from '#/api/oa/task';

import { Page, useVbenModal } from '@vben/common-ui';
import { formatDate } from '@vben/utils';

import { ElLoading, ElMessage, ElProgress, ElTag } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTask, getPublishedTaskPage } from '#/api/oa/task';
import { $t } from '#/locales';
import { getTaskStatusProgress } from '#/views/oa/utils/format';

import { useGridColumns, useGridFormSchema } from './data';
import Detail from './modules/detail.vue';
import Form from './modules/form.vue';

defineOptions({ name: 'OaTaskList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: Detail,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建任务 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑任务 */
function handleEdit(row: OaTaskApi.Task) {
  formModalApi.setData(row).open();
}

/** 查看任务详情 */
function handleDetail(row: OaTaskApi.Task) {
  detailModalApi.setData({ id: row.id, mode: 'published' }).open();
}

/** 删除发布的任务 */
async function handleDelete(row: OaTaskApi.Task) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.id]),
  });
  try {
    await deleteTask(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.id]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getPublishedTaskPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<OaTaskApi.Task>,
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <DetailModal @success="handleRefresh" />

    <Grid table-title="任务列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['任务']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:task:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #title="{ row }">
        <span class="cursor-pointer text-primary" @click="handleDetail(row)">
          {{ row.title }}
        </span>
        <ElTag v-if="row.top" class="ml-1.5" size="small" type="danger">
          置顶
        </ElTag>
      </template>
      <template #receivers="{ row }">
        {{
          row.receivers
            ?.map((receiver) => receiver.userName)
            .filter(Boolean)
            .join('、') || '-'
        }}
      </template>
      <template #statusProgress="{ row }">
        <ElProgress :percentage="getTaskStatusProgress(row.status)" />
      </template>
      <template #period="{ row }">
        {{ formatDate(row.startTime, 'YYYY-MM-DD') }} 至
        {{ formatDate(row.endTime, 'YYYY-MM-DD') }}
      </template>
      <template #canceledTag="{ row }">
        <ElTag :type="row.canceled ? 'danger' : 'success'">
          {{ row.canceled ? '已取消' : '正常' }}
        </ElTag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['oa:task:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:task:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.id]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
