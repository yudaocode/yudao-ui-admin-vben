<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmPerformanceResultTemplateApi } from '#/api/hrm/performance/config/result-template';

import { ref } from 'vue';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deletePerformanceResultTemplate,
  deletePerformanceResultTemplateList,
  getPerformanceResultTemplatePage,
} from '#/api/hrm/performance/config/result-template';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmPerformanceResultTemplate' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const checkedIds = ref<number[]>([]);

function handleRefresh() {
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function handleEdit(
  row: HrmPerformanceResultTemplateApi.PerformanceResultTemplate,
) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

async function handleDelete(id: number) {
  await confirm($t('ui.actionMessage.deleteConfirm'));
  await deletePerformanceResultTemplate(id);
  message.success($t('ui.actionMessage.deleteSuccess'));
  handleRefresh();
}

async function handleDeleteBatch() {
  if (checkedIds.value.length === 0) return;
  await confirm($t('ui.actionMessage.deleteConfirm'));
  await deletePerformanceResultTemplateList(checkedIds.value);
  checkedIds.value = [];
  message.success($t('ui.actionMessage.deleteSuccess'));
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: { schema: useGridFormSchema() },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) =>
          getPerformanceResultTemplatePage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          }),
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    checkboxConfig: { highlight: true },
  } as VxeTableGridOptions<HrmPerformanceResultTemplateApi.PerformanceResultTemplate>,
  gridEvents: {
    checkboxAll: ({
      records,
    }: {
      records: HrmPerformanceResultTemplateApi.PerformanceResultTemplate[];
    }) => {
      checkedIds.value = records.map((r) => r.id!).filter(Boolean);
    },
    checkboxChange: ({
      records,
    }: {
      records: HrmPerformanceResultTemplateApi.PerformanceResultTemplate[];
    }) => {
      checkedIds.value = records.map((r) => r.id!).filter(Boolean);
    },
  },
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【绩效】绩效模板、绩效计划"
        url="https://doc.iocoder.cn/hrm/performance/template-plan/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid table-title="考核结果设置">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:performance:result-template:create'],
              onClick: handleCreate,
            },
            {
              label: '批量删除',
              type: 'primary',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:performance:result-template:delete'],
              disabled: !checkedIds.length,
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
              auth: ['hrm:performance:result-template:update'],
              onClick: () => handleEdit(row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['hrm:performance:result-template:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm'),
                confirm: () => handleDelete(row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
