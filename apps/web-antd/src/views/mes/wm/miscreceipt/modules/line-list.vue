<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMiscReceiptLineApi } from '#/api/mes/wm/miscreceipt/line';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMiscReceiptLine,
  getMiscReceiptLineListByReceiptId,
} from '#/api/mes/wm/miscreceipt/line';
import { $t } from '#/locales';

import { type FormType, useLineGridColumns } from '../data';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  receiptId: number;
}>();

const isEditable = computed(() => // 是否可编辑明细行
  ['create', 'update'].includes(props.formType),
);

const [LineFormModal, lineFormModalApi] = useVbenModal({
  connectedComponent: LineForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 添加物料 */
function handleCreate() {
  lineFormModalApi.setData({ receiptId: props.receiptId }).open();
}

/** 编辑物料 */
function handleEdit(row: MesWmMiscReceiptLineApi.MiscReceiptLine) {
  lineFormModalApi.setData({ id: row.id, receiptId: props.receiptId }).open();
}

/** 删除物料 */
async function handleDelete(row: MesWmMiscReceiptLineApi.MiscReceiptLine) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deleteMiscReceiptLine(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(isEditable.value),
    height: 360,
    keepSource: true,
    pagerConfig: {
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          if (!props.receiptId) {
            return { list: [], total: 0 };
          }
          const list = await getMiscReceiptLineListByReceiptId(props.receiptId);
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
  } as VxeTableGridOptions<MesWmMiscReceiptLineApi.MiscReceiptLine>,
});
</script>

<template>
  <div>
    <LineFormModal @success="handleRefresh" />
    <Grid table-title="物料信息">
      <template v-if="isEditable" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '添加物料',
              type: 'primary',
              icon: ACTION_ICON.ADD,
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
              ifShow: isEditable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              ifShow: isEditable,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.itemName]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
