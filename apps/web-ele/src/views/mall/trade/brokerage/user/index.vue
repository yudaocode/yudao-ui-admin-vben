<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElMessage, ElSwitch } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  clearBindUser,
  getBrokerageUserPage,
  updateBrokerageEnabled,
} from '#/api/mall/trade/brokerage/user';

import { useGridColumns, useGridFormSchema } from './data';
import CreateForm from './modules/create-form.vue';
import BrokerageOrderListModal from './modules/order-list-modal.vue';
import UpdateForm from './modules/update-form.vue';
import BrokerageUserListModal from './modules/user-list-modal.vue';

defineOptions({ name: 'TradeBrokerageUser' });

const [CreateFormModal, createFormModalApi] = useVbenModal({
  connectedComponent: CreateForm,
  destroyOnClose: true,
});

const [UpdateFormModal, updateModalApi] = useVbenModal({
  connectedComponent: UpdateForm,
  destroyOnClose: true,
});

const [OrderListModal, orderListModalApi] = useVbenModal({
  connectedComponent: BrokerageOrderListModal,
  destroyOnClose: true,
});

const [UserListModal, userListModalApi] = useVbenModal({
  connectedComponent: BrokerageUserListModal,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建分销员 */
function handleCreate() {
  createFormModalApi.open();
}

/** 修改分销员 */
function handleUpdateForm(row: MallBrokerageUserApi.BrokerageUser) {
  updateModalApi.setData(row).open();
}

/** 打开推广人列表 */
function handleOpenUserList(row: MallBrokerageUserApi.BrokerageUser) {
  userListModalApi.setData(row).open();
}

/** 打开推广订单列表 */
function handleOpenOrderList(row: MallBrokerageUserApi.BrokerageUser) {
  orderListModalApi.setData(row).open();
}

/** 清除上级推广人 */
async function handleClearBindUser(row: MallBrokerageUserApi.BrokerageUser) {
  await confirm(`确定清除"${row.nickname}"的上级推广人吗？`);
  try {
    await clearBindUser({ id: row.id as number });
    ElMessage.success('清除成功');
    handleRefresh();
  } catch {
    // 清除失败时不做处理
  }
}

/** 更新推广资格 */
async function handleBrokerageEnabledChange(
  row: MallBrokerageUserApi.BrokerageUser,
) {
  const text = row.brokerageEnabled ? '开通' : '关闭';
  try {
    await updateBrokerageEnabled({
      id: row.id as number,
      enabled: row.brokerageEnabled as boolean,
    });
    ElMessage.success(`${text}成功`);
    handleRefresh();
  } catch {
    // 异常时，需要重置回之前的值
    row.brokerageEnabled = !row.brokerageEnabled;
  }
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

    <!-- 创建分销员 -->
    <CreateFormModal @success="handleRefresh" />
    <!-- 修改分销员 -->
    <UpdateFormModal @success="handleRefresh" />
    <!-- 推广人列表 -->
    <UserListModal />
    <!-- 推广订单列表 -->
    <OrderListModal />
    <Grid>
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

      <template #brokerageEnabled="{ row }">
        <ElSwitch
          v-model="row.brokerageEnabled"
          checked-children="有"
          un-checked-children="无"
          @change="handleBrokerageEnabledChange(row)"
        />
      </template>

      <template #actions="{ row }">
        <TableAction
          :drop-down-actions="[
            {
              label: '推广人',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:user-query'],
              onClick: handleOpenUserList.bind(null, row),
            },
            {
              label: '推广订单',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:order-query'],
              onClick: handleOpenOrderList.bind(null, row),
            },
            {
              label: '修改上级推广人',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:update-bind-user'],
              onClick: handleUpdateForm.bind(null, row),
            },
            {
              label: '清除上级推广人',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:clear-bind-user'],
              ifShow: !!row.bindUserId,
              onClick: handleClearBindUser.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
