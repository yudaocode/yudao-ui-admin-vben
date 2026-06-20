<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ImManagerSensitiveWordApi } from '#/api/im/manager/sensitiveword';

import { ref } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';
import { isEmpty } from '@vben/utils';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteManagerSensitiveWord,
  deleteManagerSensitiveWordList,
  getManagerSensitiveWordPage,
} from '#/api/im/manager/sensitiveword';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'ImManagerSensitiveWord' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建敏感词 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑敏感词 */
function handleEdit(row: ImManagerSensitiveWordApi.SensitiveWord) {
  formModalApi.setData(row).open();
}

/** 删除敏感词 */
async function handleDelete(row: ImManagerSensitiveWordApi.SensitiveWord) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.word]),
    duration: 0,
  });
  try {
    await deleteManagerSensitiveWord(row.id);
    message.success($t('ui.actionMessage.deleteSuccess', [row.word]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const checkedIds = ref<number[]>([]);

/** 表格选中变化 */
function handleRowCheckboxChange({
  records,
}: {
  records: ImManagerSensitiveWordApi.SensitiveWord[];
}) {
  checkedIds.value = records.map((item) => item.id);
}

/** 批量删除敏感词 */
async function handleDeleteBatch() {
  await confirm($t('ui.actionMessage.deleteBatchConfirm'));
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deletingBatch'),
    duration: 0,
  });
  try {
    await deleteManagerSensitiveWordList(checkedIds.value);
    checkedIds.value = [];
    message.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } finally {
    hideLoading();
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
          return await getManagerSensitiveWordPage({
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
  } as VxeTableGridOptions<ImManagerSensitiveWordApi.SensitiveWord>,
  gridEvents: {
    checkboxAll: handleRowCheckboxChange,
    checkboxChange: handleRowCheckboxChange,
  },
});
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="handleRefresh" />
    <Grid table-title="敏感词列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['敏感词']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['im:manager:sensitive-word:create'],
              onClick: handleCreate,
            },
            {
              label: $t('ui.actionTitle.deleteBatch'),
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:sensitive-word:delete'],
              disabled: isEmpty(checkedIds),
              onClick: handleDeleteBatch,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['im:manager:sensitive-word:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['im:manager:sensitive-word:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.word]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
