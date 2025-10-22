<script lang="ts" setup>
// 严格遵循导入顺序原则
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallRewardActivityApi } from '#/api/mall/promotion/reward/rewardActivity';

import { Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  closeRewardActivity,
  deleteRewardActivity,
  getRewardActivityPage,
} from '#/api/mall/promotion/reward/rewardActivity';
import { $t } from '#/locales';

import { useGridColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'PromotionRewardActivity' });

// 1. 使用 useVbenModal 初始化弹窗
const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 2. 定义业务操作函数
function handleCreate() {
  formModalApi.setData(null).open();
}

function handleEdit(row: MallRewardActivityApi.RewardActivity) {
  formModalApi.setData({ id: row.id }).open();
}

async function handleClose(row: MallRewardActivityApi.RewardActivity) {
  const hideLoading = message.loading({
    content: '活动关闭中...',
    duration: 0,
  });
  try {
    await closeRewardActivity(row.id!);
    message.success({
      content: '关闭成功',
    });
    handleRefresh();
  } finally {
    hideLoading();
  }
}

async function handleDelete(row: MallRewardActivityApi.RewardActivity) {
  await deleteRewardActivity(row.id!);
  message.success($t('common.delSuccess'));
  handleRefresh();
}

function handleRefresh() {
  gridApi.query();
}

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
          return await getRewardActivityPage(params);
        },
      },
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page>
    <!-- 弹窗组件的注册 -->
    <FormModal @success="handleRefresh" />

    <!-- 列表组件的渲染 -->
    <Grid table-title="满减送活动">
      <!-- 工具栏按钮 -->
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['活动']),
              icon: ACTION_ICON.ADD,
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <!-- 操作列按钮 -->
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('common.edit'),
              icon: ACTION_ICON.EDIT,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '关闭',
              icon: ACTION_ICON.CLOSE,
              danger: true,
              ifShow: row.status === 0,
              popConfirm: {
                title: '确认关闭该满减活动吗？',
                confirm: handleClose.bind(null, row),
              },
            },
            {
              label: $t('common.delete'),
              icon: ACTION_ICON.DELETE,
              danger: true,
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
