<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { FmsVoucherWordApi } from '#/api/fms/config/voucher-word';

import { computed, watch } from 'vue';

import { DocAlert, confirm, Page, useVbenModal } from '@vben/common-ui';

import { ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteVoucherWord,
  getVoucherWordList,
} from '#/api/fms/config/voucher-word';
import { $t } from '#/locales';
import { useFmsStore } from '#/views/fms/store/fms';

import { useGridColumns } from './data';
import Form from './modules/form.vue';

defineOptions({ name: 'FmsVoucherWord' });

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
function handleEdit(row: FmsVoucherWordApi.VoucherWord) {
  if (!accountSetId.value) return;
  formModalApi.setData({ ...row }).open();
}

/** 删除 */
async function handleDelete(row: FmsVoucherWordApi.VoucherWord) {
  if (!accountSetId.value) return;
  // 默认凭证字不允许删除
  if (row.defaultStatus) {
    ElMessage.error('默认凭证字不允许删除');
    return;
  }
  try {
    // 删除的二次确认
    await confirm(`是否确认删除凭证字“${row.name}”？`);
    await deleteVoucherWord(accountSetId.value, row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess'));
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
          const list = await getVoucherWordList(accountSetId.value);
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
  } as VxeTableGridOptions<FmsVoucherWordApi.VoucherWord>,
});
</script>

<template>
  <Page auto-content-height>
    <template #doc>
      <DocAlert
        title="【设置】凭证字、常用摘要、凭证模板"
        url="https://doc.iocoder.cn/fms/config/voucher/"
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
              auth: ['fms:config:voucher-word:create'],
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
              auth: ['fms:config:voucher-word:update'],
              ifShow: fmsStore.isAccountSetWritable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              auth: ['fms:config:voucher-word:delete'],
              ifShow: fmsStore.isAccountSetWritable,
              onClick: handleDelete.bind(null, row),
            },
          ]"
        />
      </template>
    </Grid>
  </Page>
</template>
