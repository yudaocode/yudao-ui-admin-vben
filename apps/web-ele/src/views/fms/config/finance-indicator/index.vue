<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsFinanceIndicatorApi } from '#/api/fms/config/finance-indicator';

import { computed, watch } from 'vue';

import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteFinanceIndicator,
  getFinanceIndicatorList,
} from '#/api/fms/config/finance-indicator';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'FmsFinanceIndicator' });

const fmsStore = useFmsStore(); // FMS Store
const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增财务指标 */
function handleCreate() {
  if (!accountSetId.value) return;
  formModalApi.setData({ accountSetId: accountSetId.value }).open();
}

/** 编辑财务指标 */
function handleEdit(row: FmsFinanceIndicatorApi.FinanceIndicator) {
  if (!accountSetId.value) return;
  formModalApi
    .setData({ accountSetId: accountSetId.value, id: row.id })
    .open();
}

/** 删除财务指标 */
async function handleDelete(row: FmsFinanceIndicatorApi.FinanceIndicator) {
  if (!accountSetId.value) return;
  try {
    // 删除的二次确认
    await confirm(`是否确认删除财务指标“${row.name}”？`);
  } catch {
    return;
  }
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.name]),
  });
  try {
    await deleteFinanceIndicator(accountSetId.value, row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.name]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
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
          // 未选择账套时不发起查询
          if (!accountSetId.value) return [];
          return await getFinanceIndicatorList(accountSetId.value);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
      isHover: true,
    },
    showOverflow: true,
    toolbarConfig: {
      refresh: true,
    },
  } as VxeTableGridOptions<FmsFinanceIndicatorApi.FinanceIndicator>,
});

// 账套切换后重新加载列表
watch(accountSetId, () => {
  gridApi.query();
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

    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['财务指标']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['fms:config:finance-indicator:create'],
              ifShow: fmsStore.isAccountSetWritable,
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
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              auth: ['fms:config:finance-indicator:update'],
              ifShow: fmsStore.isAccountSetWritable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['fms:config:finance-indicator:delete'],
              ifShow: fmsStore.isAccountSetWritable,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
