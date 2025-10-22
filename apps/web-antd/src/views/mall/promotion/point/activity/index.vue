<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { computed } from 'vue';

import { confirm, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  closePointActivity,
  deletePointActivity,
  getPointActivityPage,
} from '#/api/mall/promotion/point';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'PromotionPointActivity' });

// 1. 使用 useVbenModal 初始化弹窗
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 2. 定义业务操作函数
function handleCreate() {
  formModalApi.setData(null).open();
}

function handleEdit(row: any) {
  formModalApi.setData(row).open();
}

async function handleClose(row: any) {
  await confirm({
    title: '提示',
    content: '确认关闭该积分商城活动吗？',
  });
  await closePointActivity(row.id);
  message.success('关闭成功');
  gridApi.query();
}

async function handleDelete(row: any) {
  await deletePointActivity(row.id);
  message.success($t('common.delSuccess'));
  gridApi.query();
}

function handleRefresh() {
  gridApi.query();
}

// 计算操作按钮
const getActions = computed(() => (row: any) => {
  const actions: any[] = [
    {
      label: $t('common.edit'),
      icon: ACTION_ICON.EDIT,
      onClick: handleEdit.bind(null, row),
    },
  ];

  // 如果状态是启用(0)，显示关闭按钮
  if (row.status === 0) {
    actions.push({
      label: '关闭',
      icon: ACTION_ICON.CLOSE,
      danger: true,
      popConfirm: {
        title: '确认关闭该积分商城活动吗？',
        confirm: handleClose.bind(null, row),
      },
    });
  } else {
    // 否则显示删除按钮
    actions.push({
      label: $t('common.delete'),
      icon: ACTION_ICON.DELETE,
      danger: true,
      popConfirm: {
        title: $t('ui.actionMessage.deleteConfirm', [row.spuName]),
        confirm: handleDelete.bind(null, row),
      },
    });
  }

  return actions;
});

// 3. 使用 useVbenVxeGrid 初始化列表
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(),
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const params = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          const data = await getPointActivityPage(params);
          return { items: data.list, total: data.total };
        },
      },
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page
    description="积分商城活动，用于管理积分兑换商品的配置"
    doc-link="https://doc.iocoder.cn/mall/promotion-point/"
    title="积分商城活动"
  >
    <!-- 弹窗组件的注册 -->
    <FormModal @success="handleRefresh" />

    <!-- 列表组件的渲染 -->
    <Grid table-title="积分商城活动列表">
      <!-- 工具栏按钮 -->
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['积分活动']),
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <!-- 操作列按钮 -->
      <template #actions="{ row }">
        <TableAction :actions="getActions(row)" />
      </template>
    </Grid>
  </Page>
</template>
