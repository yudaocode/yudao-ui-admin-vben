<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  clearBindUser,
  getBrokerageUserPage,
  updateBrokerageEnabled,
} from '#/api/mall/trade/brokerage/user';

import { useGridColumns, useGridFormSchema } from './data';
import BrokerageOrderListModal from './modules/order-list-modal.vue';
import BrokerageUserCreateForm from './modules/user-create-form.vue';
import BrokerageUserListModal from './modules/user-list-modal.vue';
import BrokerageUserUpdateForm from './modules/user-update-form.vue';

defineOptions({ name: 'TradeBrokerageUser' });

const [OrderListModal, orderListModalApi] = useVbenModal({
  connectedComponent: BrokerageOrderListModal,
});

const [UserCreateModal, userCreateModalApi] = useVbenModal({
  connectedComponent: BrokerageUserCreateForm,
});

const [UserListModal, userListModalApi] = useVbenModal({
  connectedComponent: BrokerageUserListModal,
});

const [UserUpdateModal, userUpdateModalApi] = useVbenModal({
  connectedComponent: BrokerageUserUpdateForm,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 打开推广人列表 */
function handleOpenUserList(row: MallBrokerageUserApi.BrokerageUser) {
  userListModalApi.setData(row).open();
}

/** 打开推广订单列表 */
function handleOpenOrderList(row: MallBrokerageUserApi.BrokerageUser) {
  orderListModalApi.setData(row).open();
}

/** 打开表单：修改上级推广人 */
function handleOpenUpdateForm(row: MallBrokerageUserApi.BrokerageUser) {
  userUpdateModalApi.setData(row).open();
}

/** 创建分销员 */
function handleCreate() {
  userCreateModalApi.open();
}

/** 清除上级推广人 */
async function handleClearBindUser(row: MallBrokerageUserApi.BrokerageUser) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.nickname]),
    duration: 0,
  });
  try {
    await clearBindUser({ id: row.id as number });
    message.success($t('ui.actionMessage.deleteSuccess', [row.nickname]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

/** 更新推广资格 */
async function handleBrokerageEnabledChange(
  newEnabled: boolean,
  row: MallBrokerageUserApi.BrokerageUser,
): Promise<boolean | undefined> {
  return new Promise((resolve, reject) => {
    const text = newEnabled ? '开通' : '关闭';
    confirm({
      content: `你要将${row.nickname}的推广资格切换为【${text}】吗？`,
    })
      .then(async () => {
        // 更新推广资格
        const res = await updateBrokerageEnabled({
          id: row.id!,
          enabled: newEnabled,
        });
        if (res) {
          // 提示并返回成功
          message.success($t('ui.actionMessage.operationSuccess'));
          handleRefresh();
          resolve(true);
        } else {
          reject(new Error('更新失败'));
        }
      })
      .catch(() => {
        reject(new Error('取消操作'));
      });
  });
}

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
  },
  gridOptions: {
    columns: useGridColumns(handleBrokerageEnabledChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getBrokerageUserPage({
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
  } as VxeTableGridOptions<MallBrokerageUserApi.BrokerageUser>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【交易】分销返佣"
        url="https://doc.iocoder.cn/mall/trade-brokerage/"
      />
    </template>

    <Grid table-title="分销用户列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['分销员']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['trade:brokerage-user:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :drop-down-actions="[
            {
              label: '推广人',
              type: 'link',
              auth: ['trade:brokerage-user:user-query'],
              onClick: handleOpenUserList.bind(null, row),
            },
            {
              label: '推广订单',
              type: 'link',
              auth: ['trade:brokerage-user:order-query'],
              onClick: handleOpenOrderList.bind(null, row),
            },
            {
              label: '修改上级推广人',
              type: 'link',
              auth: ['trade:brokerage-user:update-bind-user'],
              onClick: handleOpenUpdateForm.bind(null, row),
            },
            {
              label: '清除上级推广人',
              type: 'link',
              auth: ['trade:brokerage-user:clear-bind-user'],
              ifShow: !!row.bindUserId,
              onClick: handleClearBindUser.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 修改上级推广人表单 -->
    <UserUpdateModal @success="handleRefresh" />
    <!-- 推广人列表 -->
    <UserListModal />
    <!-- 推广订单列表 -->
    <OrderListModal />
    <!-- 创建分销员 -->
    <UserCreateModal @success="handleRefresh" />
  </Page>
</template>
