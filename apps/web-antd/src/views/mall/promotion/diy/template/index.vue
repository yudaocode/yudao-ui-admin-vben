<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallDiyTemplateApi } from '#/api/mall/promotion/diy/template';

import { useRouter } from 'vue-router';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDiyTemplate,
  getDiyTemplatePage,
  useDiyTemplate,
} from '#/api/mall/promotion/diy/template';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import DiyTemplateForm from './modules/form.vue';

defineOptions({ name: 'PromotionDiyTemplate' });

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: DiyTemplateForm,
  destroyOnClose: true,
});

const router = useRouter();

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建DIY模板 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑DIY模板 */
function handleEdit(row: MallDiyTemplateApi.DiyTemplate) {
  formModalApi.setData(row).open();
}

/** 装修模板 */
function handleDecorate(row: MallDiyTemplateApi.DiyTemplate) {
  // 跳转到装修页面
  router.push({ name: 'DiyTemplateDecorate', params: { id: row.id } });
}

/** 使用模板 */
async function handleUse(row: MallDiyTemplateApi.DiyTemplate) {
  confirm({
    content: `是否使用模板"${row.name}"?`,
  }).then(async () => {
    // 发起删除
    await useDiyTemplate(row.id as number);
    message.success('使用成功');
    onRefresh();
  });
}

/** 删除DIY模板 */
async function handleDelete(row: MallDiyTemplateApi.DiyTemplate) {
  await deleteDiyTemplate(row.id as number);
  onRefresh();
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
          return await getDiyTemplatePage({
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
  } as VxeTableGridOptions<MallDiyTemplateApi.DiyTemplate>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【营销】商城装修"
        url="https://doc.iocoder.cn/mall/diy/"
      />
    </template>

    <FormModal @success="onRefresh" />

    <Grid table-title="装修模板列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['装修模板']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['promotion:diy-template:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '装修',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['promotion:diy-template:update'],
              onClick: handleDecorate.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['promotion:diy-template:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '使用',
              type: 'link' as const,
              auth: ['promotion:diy-template:use'],
              ifShow: !row.used,
              onClick: handleUse.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link' as const,
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['promotion:diy-template:delete'],
              ifShow: !row.used,
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
