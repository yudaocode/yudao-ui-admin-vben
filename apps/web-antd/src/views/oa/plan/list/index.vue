<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OaPlanApi } from '#/api/oa/plan';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePlan, getPlanPage } from '#/api/oa/plan';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'OaPlanList' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建工作计划 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑工作计划 */
function handleEdit(row: OaPlanApi.Plan) {
  formModalApi.setData(row).open();
}

/** 删除工作计划 */
async function handleDelete(row: OaPlanApi.Plan) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.id]),
    duration: 0,
  });
  try {
    await deletePlan(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.id]));
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
          return await getPlanPage({
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
  } as VxeTableGridOptions<OaPlanApi.Plan>,
});
</script>

<template>
  <Page auto-content-height>
    <DocAlert title="【协作】日程、任务、计划与汇报" url="https://doc.iocoder.cn/oa/collaboration/work/" />
    <FormModal @success="handleRefresh" />

    <Grid table-title="工作计划列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['工作计划']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['oa:plan:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #comment="{ row }">
        <div class="whitespace-pre-line">{{ row.comment || '-' }}</div>
      </template>
      <template #fileUrls="{ row }">
        <span v-if="row.fileUrls?.length">{{ row.fileUrls.length }}</span>
        <span v-else>-</span>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['oa:plan:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['oa:plan:delete'],
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
