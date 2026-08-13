<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { HrmSalaryChangeTemplateApi } from '#/api/hrm/salary/config/change-template';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message, Space, Tag } from 'antdv-next';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSalaryChangeTemplate,
  getSalaryChangeTemplateList,
} from '#/api/hrm/salary/config/change-template';
import { $t } from '#/locales';
import { formatHrmYesNo } from '#/views/hrm/utils/format';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'HrmSalaryChangeTemplate' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function handleRefresh() {
  gridApi.query();
}

function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

function handleEdit(row: HrmSalaryChangeTemplateApi.SalaryChangeTemplate) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

async function handleDelete(
  row: HrmSalaryChangeTemplateApi.SalaryChangeTemplate,
) {
  await confirm(`确认删除调薪模板"${row.name}"吗？`);
  await deleteSalaryChangeTemplate(row.id!);
  message.success($t('ui.actionMessage.operationSuccess'));
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getSalaryChangeTemplateList();
          return { list, total: list.length };
        },
      },
    },
    rowConfig: { keyField: 'id', isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions<HrmSalaryChangeTemplateApi.SalaryChangeTemplate>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【薪资】计薪设置、薪资档案"
        url="https://doc.iocoder.cn/hrm/salary/config/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['hrm:salary:change-template:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #defaultStatus="{ row }">
        <Tag :color="row.defaultStatus ? 'success' : 'default'">
          {{ formatHrmYesNo(row.defaultStatus) }}
        </Tag>
      </template>
      <template #options="{ row }">
        <Space wrap>
          <Tag
            v-for="item in row.options || []"
            :key="item.code"
            color="processing"
          >
            {{ item.name }}
          </Tag>
        </Space>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              type: 'link',
              auth: ['hrm:salary:change-template:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              auth: ['hrm:salary:change-template:delete'],
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
