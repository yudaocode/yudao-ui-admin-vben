<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcTemplateItemApi } from '#/api/mes/qc/template/item';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTemplateItem,
  getTemplateItemPage,
} from '#/api/mes/qc/template/item';
import { $t } from '#/locales';

import { useItemGridColumns } from '../data';
import ItemForm from './item-form.vue';

const props = defineProps<{
  readonly?: boolean;
  templateId: number;
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: ItemForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建产品关联 */
function handleCreate() {
  formModalApi.setData({ templateId: props.templateId }).open();
}

/** 编辑产品关联 */
function handleEdit(row: MesQcTemplateItemApi.TemplateItem) {
  formModalApi.setData({ ...row, templateId: props.templateId }).open();
}

/** 删除产品关联 */
async function handleDelete(row: MesQcTemplateItemApi.TemplateItem) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deleteTemplateItem(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useItemGridColumns(),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getTemplateItemPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            templateId: props.templateId,
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
    },
  } as VxeTableGridOptions<MesQcTemplateItemApi.TemplateItem>,
});
</script>

<template>
  <div>
    <FormModal @success="handleRefresh" />
    <Grid table-title="产品关联">
      <template v-if="!readonly" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增产品关联',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-template:create'],
              onClick: handleCreate,
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
              auth: ['mes:qc-template:update'],
              ifShow: !readonly,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:qc-template:update'],
              ifShow: !readonly,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
