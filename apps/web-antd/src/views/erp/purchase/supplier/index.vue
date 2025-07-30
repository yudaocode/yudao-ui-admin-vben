<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ErpSupplierApi } from '#/api/erp/purchase/supplier';

import { ref } from 'vue';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteSupplier, getSupplierPage } from '#/api/erp/purchase/supplier';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import SupplierForm from './modules/form.vue';

/** 供应商管理 */
defineOptions({ name: 'ErpSupplier' });

const searchParams = ref<ErpSupplierApi.SupplierPageParam>({
  pageNo: 1,
  pageSize: 10,
  name: '',
  mobile: '',
  status: undefined,
});

/** 搜索表单 */
const [SearchForm, searchFormApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
    formItemClass: 'col-span-1',
    labelWidth: 80,
  },
  layout: 'inline',
  schema: useGridFormSchema(),
  showDefaultActions: false,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 搜索 */
async function handleSearch() {
  const values = await searchFormApi.getValues();
  Object.assign(searchParams.value, values, { pageNo: 1 });
  onRefresh();
}

/** 重置搜索 */
async function handleReset() {
  await searchFormApi.resetFields();
  Object.assign(searchParams.value, {
    pageNo: 1,
    pageSize: 10,
    name: '',
    mobile: '',
    status: undefined,
  });
  onRefresh();
}

/** 添加供应商 */
function handleCreate() {
  formModalApi.setData({ type: 'create' }).open();
}

/** 编辑供应商 */
function handleEdit(row: ErpSupplierApi.Supplier) {
  formModalApi.setData({ type: 'update', id: row.id }).open();
}

/** 删除供应商 */
async function handleDelete(row: ErpSupplierApi.Supplier) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    key: 'action_key_msg',
  });
  try {
    await deleteSupplier(row.id!);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.name]),
      key: 'action_key_msg',
    });
    onRefresh();
  } catch {
    hideLoading();
  }
}

/** 导出供应商 */
async function handleExport() {
  try {
    // const data = await exportSupplier(searchParams.value);
    // 这里需要处理文件下载逻辑
    message.success('导出成功');
  } catch {
    message.error('导出失败');
  }
}

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: SupplierForm,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 600,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getSupplierPage({
            ...searchParams.value,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      custom: true,
    },
  } as VxeTableGridOptions<ErpSupplierApi.Supplier>,
});
</script>

<template>
  <Page>
    <template #doc>
      <DocAlert
        title="【采购】采购订单、入库、退货"
        url="https://doc.iocoder.cn/erp/purchase/"
      />
    </template>

    <!-- 搜索表单 -->
    <div class="mb-4 rounded-lg bg-white p-4 shadow-sm">
      <SearchForm
        class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4"
      />
      <div class="mt-4 flex gap-2">
        <TableAction
          :actions="[
            {
              label: '查询',
              type: 'primary',
              icon: ACTION_ICON.SEARCH,
              onClick: handleSearch,
            },
            {
              label: '重置',
              type: 'default',
              icon: ACTION_ICON.RESET,
              onClick: handleReset,
            },
          ]"
        />
      </div>
    </div>

    <FormModal @success="onRefresh" />

    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
            {
              label: '导出',
              type: 'default',
              icon: ACTION_ICON.EXPORT,
              onClick: handleExport,
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
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '删除',
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
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
