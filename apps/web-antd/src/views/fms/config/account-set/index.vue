<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsAccountSetApi } from '#/api/fms/config/account-set';

import { DocAlert, Page, useVbenModal } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { FmsAccountUserLevelEnum } from '#/api/fms/config/account-user';
import { useFmsStore } from '#/views/fms/store/fms';

import { useGridColumns } from './data';
import Form from './modules/form.vue';
import InitializeForm from './modules/initialize-form.vue';
import MemberForm from './modules/member-form.vue';

defineOptions({ name: 'FmsAccountSet' });

const fmsStore = useFmsStore(); // FMS 状态

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});
const [InitializeModal, initializeModalApi] = useVbenModal({
  connectedComponent: InitializeForm,
  destroyOnClose: true,
});
const [MemberModal, memberModalApi] = useVbenModal({
  connectedComponent: MemberForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增 */
function handleCreate() {
  formModalApi.setData(null).open();
}

/** 编辑 */
function handleEdit(row: FmsAccountSetApi.AccountSet) {
  formModalApi.setData(row).open();
}

/** 开始记账（初始化账套） */
function handleInitialize(row: FmsAccountSetApi.AccountSet) {
  initializeModalApi.setData(row).open();
}

/** 账套授权 */
function handleMember(row: FmsAccountSetApi.AccountSet) {
  memberModalApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          // 同时刷新账套上下文，清除已删除或无权访问的当前账套
          return await fmsStore.loadAccountSetList(true);
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
  } as VxeTableGridOptions<FmsAccountSetApi.AccountSet>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设置】账套管理、财务参数、财务指标"
        url="https://doc.iocoder.cn/fms/config/account-set/"
      />
    </template>
    <FormModal @success="handleRefresh" />
    <InitializeModal @success="handleRefresh" />
    <MemberModal @success="handleRefresh" />

    <Grid table-title="账套列表">
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['fms:config:account-set:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #companyName="{ row }">
        <span>{{ row.companyName }}</span>
        <Tag v-if="row.defaultStatus" class="ml-2">默认</Tag>
      </template>
      <template #initialized="{ row }">
        <Tag :color="row.initialized ? 'success' : 'default'">
          {{ row.initialized ? '已启用' : '待初始化' }}
        </Tag>
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: '编辑',
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['fms:config:account-set:update'],
              ifShow: row.level === FmsAccountUserLevelEnum.OWNER,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: '授权',
              type: 'link',
              auth: ['fms:config:account-set:authorize'],
              ifShow: row.level === FmsAccountUserLevelEnum.OWNER,
              onClick: handleMember.bind(null, row),
            },
            {
              label: '开始记账',
              type: 'link',
              auth: ['fms:config:account-set:initialize'],
              ifShow:
                !row.initialized && row.level !== FmsAccountUserLevelEnum.READ,
              onClick: handleInitialize.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
