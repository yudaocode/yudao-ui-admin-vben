<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MallBrokerageUserApi } from '#/api/mall/trade/brokerage/user';

import { useAccess } from '@vben/access';
import { confirm, DocAlert, Page, useVbenModal } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { ElLoading, ElMessage, ElSwitch } from 'element-plus';

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

const { hasAccessByCodes } = useAccess();

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

const [OrderListModal, OrderListModalApi] = useVbenModal({
  connectedComponent: BrokerageOrderListModal,
});

const [UserCreateModal, UserCreateModalApi] = useVbenModal({
  connectedComponent: BrokerageUserCreateForm,
});

const [UserListModal, UserListModalApi] = useVbenModal({
  connectedComponent: BrokerageUserListModal,
});

const [UserUpdateModal, UserUpdateModalApi] = useVbenModal({
  connectedComponent: BrokerageUserUpdateForm,
});

/** 打开推广人列表 */
function openBrokerageUserTable(row: MallBrokerageUserApi.BrokerageUser) {
  UserListModalApi.setData(row).open();
}

/** 打开推广订单列表 */
function openBrokerageOrderTable(row: MallBrokerageUserApi.BrokerageUser) {
  OrderListModalApi.setData(row).open();
}

/** 打开表单：修改上级推广人 */
function openUpdateBindUserForm(row: MallBrokerageUserApi.BrokerageUser) {
  UserUpdateModalApi.setData(row).open();
}

/** 创建分销员 */
function openCreateUserForm() {
  UserCreateModalApi.open();
}

/** 清除上级推广人 */
async function handleClearBindUser(row: MallBrokerageUserApi.BrokerageUser) {
  await confirm(`确定清除"${row.nickname}"的上级推广人吗？`);
  await clearBindUser({ id: row.id as number });
  ElMessage.success('清除成功');
  onRefresh();
}

/** 推广资格：开通/关闭 */
async function handleBrokerageEnabledChange(
  row: MallBrokerageUserApi.BrokerageUser,
) {
  const text = row.brokerageEnabled ? '开通' : '关闭';
  const loadingInstance = ElLoading.service({
    text: `正在${text}"${row.nickname}"的推广资格...`,
    fullscreen: true,
  });
  try {
    await updateBrokerageEnabled({
      id: row.id as number,
      enabled: row.brokerageEnabled as boolean,
    });
    ElMessage.success(`${text}成功`);
    onRefresh();
  } catch {
    // 异常时，需要重置回之前的值
    row.brokerageEnabled = !row.brokerageEnabled;
  } finally {
    loadingInstance.close();
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
    showOverflow: 'tooltip',
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
              onClick: openCreateUserForm,
            },
          ]"
        />
      </template>

      <template #brokerageEnabled="{ row }">
        <ElSwitch
          v-model:checked="row.brokerageEnabled"
          :disabled="
            !hasAccessByCodes(['trade:brokerage-user:update-bind-user'])
          "
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
              onClick: openBrokerageUserTable.bind(null, row),
            },
            {
              label: '推广订单',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:order-query'],
              onClick: openBrokerageOrderTable.bind(null, row),
            },
            {
              label: '修改上级推广人',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:update-bind-user'],
              onClick: openUpdateBindUserForm.bind(null, row),
            },
            {
              label: '清除上级推广人',
              type: 'primary',
              link: true,
              auth: ['trade:brokerage-user:clear-bind-user'],
              onClick: handleClearBindUser.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>

    <!-- 修改上级推广人表单 -->
    <UserUpdateModal @success="onRefresh" />
    <!-- 推广人列表 -->
    <UserListModal />
    <!-- 推广订单列表 -->
    <OrderListModal />
    <!-- 创建分销员 -->
    <UserCreateModal @success="onRefresh" />
  </Page>
</template>
