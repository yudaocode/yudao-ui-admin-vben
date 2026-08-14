<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsCurrencyApi } from '#/api/fms/config/currency';

import { computed, watch } from 'vue';

import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCurrency, getCurrencyList } from '#/api/fms/config/currency';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'FmsCurrency' });

const fmsStore = useFmsStore(); // FMS 状态

const accountSetId = computed(() => fmsStore.getAccountSetId); // 当前账套编号

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

watch(accountSetId, () => gridApi.query());

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增 */
function handleCreate() {
  if (!accountSetId.value) return;
  formModalApi.setData({ accountSetId: accountSetId.value }).open();
}

/** 编辑 */
function handleEdit(row: FmsCurrencyApi.Currency) {
  if (!accountSetId.value) return;
  formModalApi.setData({ ...row, accountSetId: accountSetId.value }).open();
}

/** 删除 */
async function handleDelete(row: FmsCurrencyApi.Currency) {
  if (!accountSetId.value) return;
  try {
    // 删除的二次确认
    await confirm(`是否确认删除币别“${row.name}”？`);
    await deleteCurrency(accountSetId.value, row.id!);
    message.success($t('ui.actionMessage.deleteSuccess'));
    handleRefresh();
  } catch {}
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useGridColumns(),
    height: 'auto',
    pagerConfig: { enabled: false },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!accountSetId.value) {
            return { list: [], total: 0 };
          }
          const list = await getCurrencyList(accountSetId.value);
          return { list, total: list.length };
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
  } as VxeTableGridOptions<FmsCurrencyApi.Currency>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设置】币别、科目、辅助核算、初始余额"
        url="https://doc.iocoder.cn/fms/config/accounting/"
      />
    </template>
    <FormModal @success="handleRefresh" />

    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['fms:config:currency:create'],
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
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['fms:config:currency:update'],
              ifShow: fmsStore.isAccountSetWritable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['fms:config:currency:delete'],
              ifShow: fmsStore.isAccountSetWritable && !row.standard,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
