<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { SystemNoticeApi } from '#/api/system/notice';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteNotice,
  deleteNoticeList,
  getNoticePage,
  pushNotice,
} from '#/api/system/notice';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建公告 */
function onCreate() {
  formModalApi.setData(null).open();
}

/** 编辑公告 */
function onEdit(row: SystemNoticeApi.Notice) {
  formModalApi.setData(row).open();
}

/** 删除公告 */
async function onDelete(row: SystemNoticeApi.Notice) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.title]),
    fullscreen: true,
  });
  try {
    await deleteNotice(row.id as number);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.title]));
    onRefresh();
  } finally {
    loadingInstance.close();
  }
}

/** 批量删除公告 */
async function onDeleteBatch() {
  await confirm('确定要批量删除该公告吗？');
  await deleteNoticeList(checkedIds.value);
  checkedIds.value = [];
  ElMessage.success($t('ui.actionMessage.deleteSuccess'));
  onRefresh();
}

const checkedIds = ref<number[]>([]);
function handleRowCheckboxChange({
  records,
}: {
  records: SystemNoticeApi.Notice[];
}) {
  checkedIds.value = records.map((item) => item.id as number);
}

/** 推送公告 */
async function onPush(row: SystemNoticeApi.Notice) {
  const loadingInstance = ElMessage({
    message: $t('ui.actionMessage.processing', ['推送']),
    type: 'info',
    duration: 0,
  });
  try {
    await pushNotice(row.id as number);
    loadingInstance.close();
    ElMessage.success($t('ui.actionMessage.operationSuccess'));
  } finally {
    loadingInstance.close();
  }
}

/** 表格操作按钮的回调函数 */
function onActionClick({
  code,
  row,
}: OnActionClickParams<SystemNoticeApi.Notice>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'push': {
      onPush(row);
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
          return await getNoticePage({
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
  } as VxeTableGridOptions<SystemNoticeApi.Notice>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="onRefresh" />
    <Grid table-title="公告列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['公告']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['system:notice:create'],
              onClick: onCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'danger',
              icon: ACTION_ICON.DELETE,
              disabled: isEmpty(checkedIds),
              auth: ['system:notice:delete'],
              onClick: onDeleteBatch,
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
