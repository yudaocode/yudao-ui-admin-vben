<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmReceivableApi } from '#/api/crm/receivable';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteReceivable,
  getReceivablePageByCustomer,
} from '#/api/crm/receivable';
import { $t } from '#/locales';

import { useDetailListColumns } from './detail-data';
import Form from './form.vue';

const props = defineProps<{
  contractId?: number; // 合同编号
  customerId?: number; // 客户编号
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建回款 */
function handleCreate() {
  formModalApi
    .setData({
      contractId: props.contractId,
      customerId: props.customerId,
    })
    .open();
}

/** 编辑回款 */
function handleEdit(row: CrmReceivableApi.Receivable) {
  formModalApi.setData({ receivable: row }).open();
}

/** 删除回款 */
async function handleDelete(row: CrmReceivableApi.Receivable) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.no]),
    key: 'action_key_msg',
  });
  try {
    await deleteReceivable(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.no]),
      key: 'action_key_msg',
    });
    onRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useDetailListColumns(),
    height: 500,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const queryParams: CrmReceivableApi.ReceivablePageParam = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
          };
          if (props.customerId && !props.contractId) {
            queryParams.customerId = props.customerId;
          } else if (props.customerId && props.contractId) {
            // 如果是合同的话客户编号也需要带上因为权限基于客户
            queryParams.customerId = props.customerId;
            queryParams.contractId = props.contractId;
          }
          return await getReceivablePageByCustomer(queryParams);
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },
    toolbarConfig: {
      refresh: true,
      search: true,
    },
  } as VxeTableGridOptions<CrmReceivableApi.Receivable>,
});
</script>

<template>
  <div>
    <FormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['回款']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['crm:receivable:create'],
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
              auth: ['crm:receivable:update'],
              onClick: handleEdit.bind(null, row),
              ifShow: row.auditStatus === 0,
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['crm:receivable:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.no]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
