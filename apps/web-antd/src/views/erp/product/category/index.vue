<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpProductCategoryApi } from '#/api/erp/product/category';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteProductCategory,
  getProductCategoryList,
} from '#/api/erp/product/category';
import { $t } from '#/locales';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 切换树形展开/收缩状态 */
const isExpanded = ref(true);
function toggleExpand() {
  isExpanded.value = !isExpanded.value;
  gridApi.grid.setAllTreeExpand(isExpanded.value);
}

/** 创建分类 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 添加下级分类 */
function handleAppend(row: ErpProductCategoryApi.ProductCategory) {
  formModalApi.setData({ parentId: row.id }).open();
}

/** 编辑分类 */
function handleEdit(row: ErpProductCategoryApi.ProductCategory) {
  formModalApi.setData(row).open();
}

/** 删除分类 */
async function handleDelete(row: ErpProductCategoryApi.ProductCategory) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteProductCategory(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async () => {
          return await getProductCategoryList();
        },
      },
    },
    pagerConfig: {
      enabled: false,
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
    treeConfig: {
      transform: true,
      rowField: 'id',
      parentField: 'parentId',
      expandAll: true,
      accordion: false,
    },
  } as VxeTableGridOptions<ErpProductCategoryApi.ProductCategory>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【产品】产品信息、分类、单位"
        url="https://doc.iocoder.cn/erp/product/"
      />
    </template>
    <FormModal @success="onRefresh" />
    <Grid table-title="产品分类列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['产品分类']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['erp:product-category:create'],
              onClick: handleCreate,
            },
            {
              label: isExpanded ? '收缩' : '展开',
              type: 'primary',
              onClick: toggleExpand,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '新增下级',
              type: 'link',
              icon: ACTION_ICON.ADD,
              auth: ['erp:product-category:create'],
              onClick: handleAppend.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['erp:product-category:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['erp:product-category:delete'],
              ifShow: !(row.children && row.children.length > 0),
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.name]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
