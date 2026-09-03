<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { PmsKnowledgeLibraryTemplateApi } from '#/api/pms/kb/library/template';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteKnowledgeLibraryTemplate,
  getKnowledgeLibraryTemplatePage,
} from '#/api/pms/kb/library/template';

import { useGridColumns, useGridFormSchema } from './data';
import KnowledgeLibraryTemplateForm from './knowledge-library-template-form.vue';

defineOptions({ name: 'PmsKnowledgeLibraryTemplate' });

const [
  KnowledgeLibraryTemplateFormModal,
  knowledgeLibraryTemplateFormModalApi,
] = useVbenModal({
  connectedComponent: KnowledgeLibraryTemplateForm,
  // TODO @AI：对齐 system user，补 destroyOnClose。删除改 TableAction popConfirm，不要 confirm + empty catch。
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增知识库模板 */
function handleCreate() {
  openForm('create');
}

/** 添加/修改操作 */
function openForm(formType: 'create' | 'update', id?: number) {
  knowledgeLibraryTemplateFormModalApi.setData({ formType, id }).open();
}

/** 删除按钮操作 */
async function handleDelete(id: number) {
  try {
    // 删除的二次确认
    await confirm('是否确认删除该知识库模板？');
    await deleteKnowledgeLibraryTemplate(id);
    message.success('删除成功');
    // 刷新列表
    handleRefresh();
  } catch {}
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnEnter: true,
  },
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getKnowledgeLibraryTemplatePage({
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
  } as VxeTableGridOptions<PmsKnowledgeLibraryTemplateApi.KnowledgeLibraryTemplate>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【PMS】知识库管理"
        url="https://doc.iocoder.cn/pms/kb/library/"
      />
    </template>
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['pms:kb:library-template:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['pms:kb:library-template:update'],
              onClick: () => openForm('update', row.id),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['pms:kb:library-template:delete'],
              onClick: () => handleDelete(row.id!),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 新增或修改知识库模板 -->
    <KnowledgeLibraryTemplateFormModal @success="handleRefresh" />
  </Page>
</template>
