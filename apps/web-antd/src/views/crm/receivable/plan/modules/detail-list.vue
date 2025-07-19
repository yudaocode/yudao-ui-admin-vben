<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { CrmReceivableApi } from '#/api/crm/receivable';
import type { CrmReceivablePlanApi } from '#/api/crm/receivable/plan';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteReceivablePlan,
  getReceivablePlanPageByCustomer,
} from '#/api/crm/receivable/plan';
import { $t } from '#/locales';

import ReceivableForm from '../../modules/form.vue';
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

const [ReceivableFormModal, receivableFormModalApi] = useVbenModal({
  connectedComponent: ReceivableForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function onRefresh() {
  gridApi.query();
}

/** 创建回款计划 */
function handleCreate() {
  formModalApi
    .setData({
      contractId: props.contractId,
      customerId: props.customerId,
    })
    .open();
}

/** 创建回款 */
function handleCreateReceivable(row: CrmReceivablePlanApi.Plan) {
  receivableFormModalApi.setData({ plan: row }).open();
}

/** 编辑回款计划 */
function handleEdit(row: CrmReceivableApi.Receivable) {
  formModalApi.setData({ receivable: row }).open();
}

/** 删除回款计划 */
async function handleDelete(row: CrmReceivablePlanApi.Plan) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.period]),
    key: 'action_key_msg',
  });
  try {
    await deleteReceivablePlan(row.id as number);
    message.success({
      content: $t('ui.actionMessage.deleteSuccess', [row.period]),
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
    height: 400,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          const queryParams: CrmReceivablePlanApi.PlanPageParam = {
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          };
          if (props.customerId && !props.contractId) {
            queryParams.customerId = props.customerId;
          } else if (props.customerId && props.contractId) {
            // 如果是合同的话客户编号也需要带上因为权限基于客户
            queryParams.customerId = props.customerId;
            queryParams.contractId = props.contractId;
          }
          return await getReceivablePlanPageByCustomer(queryParams);
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
  } as VxeTableGridOptions<CrmReceivablePlanApi.Plan>,
});
</script>

<template>
  <div>
    <FormModal @success="onRefresh" />
    <ReceivableFormModal @success="onRefresh" />
    <Grid>
      <template #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['回款计划']),
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['crm:receivable-plan:create'],
              onClick: handleCreate,
            },
          ]"
        />
      </template>
      <template #actions="{ row }">
        <TableAction
          :actions="[
            {
              label: $t('ui.actionTitle.create', ['回款']),
              type: 'link',
              icon: ACTION_ICON.ADD,
              auth: ['crm:receivable-plan:create'],
              disabled: !!row.receivableId,
              onClick: handleCreateReceivable.bind(null, row),
            },
            {
              label: $t('common.edit'),
              type: 'link',
              icon: ACTION_ICON.EDIT,
              auth: ['crm:receivable-plan:update'],
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['crm:receivable-plan:delete'],
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.period]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
