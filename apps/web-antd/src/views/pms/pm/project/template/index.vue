<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsProjectTemplateApi } from '#/api/pms/pm/project/template';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';

import { message, Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProjectTemplate,
  getProjectTemplatePage,
} from '#/api/pms/pm/project/template';

import { useGridColumns, useGridFormSchema } from './data';
import ProjectTemplateForm from './project-template-form.vue';

defineOptions({ name: 'PmsProjectTemplate' });

const [ProjectTemplateFormModal, projectTemplateFormModalApi] = useVbenModal({
  connectedComponent: ProjectTemplateForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 添加/修改操作 */
function openForm(formType: 'create' | 'update', id?: number) {
  projectTemplateFormModalApi.setData({ formType, id }).open();
}

/** 删除项目模板 */
async function handleDelete(id: number) {
  await deleteProjectTemplate(id);
  message.success('删除成功');
  handleRefresh();
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getProjectTemplatePage({
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
  } as VxeTableGridOptions<PmsProjectTemplateApi.ProjectTemplate>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】项目模板"
        url="https://doc.iocoder.cn/pms/pm/project/"
      />
    </template>

    <!-- 模板列表 -->
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['pms:pm:project-template:create'],
              onClick: openForm.bind(null, 'create'),
            },
          ]"
        />
      </template>
      <template #itemTypes="{ row }">
        <Tag v-for="type in row.itemTypes" :key="type" class="mr-1">
          {{ getDictLabel(DICT_TYPE.PMS_WORK_ITEM_TYPE, type) || '-' }}
        </Tag>
      </template>
      <template #statusCount="{ row }">
        {{ row.statuses.length }}
      </template>
      <template #boardCount="{ row }">
        {{ row.boards.length }}
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['pms:pm:project-template:update'],
              onClick: openForm.bind(null, 'update', row.id),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['pms:pm:project-template:delete'],
              popConfirm: {
                title: '是否确认删除该项目模板？',
                confirm: handleDelete.bind(null, row.id!),
              },
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 新增或修改项目模板 -->
    <ProjectTemplateFormModal @success="handleRefresh" />
  </Page>
</template>
