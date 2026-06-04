<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmSalesNoticeLineApi } from '#/api/mes/wm/salesnotice/line';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSalesNoticeLine,
  getSalesNoticeLinePage,
} from '#/api/mes/wm/salesnotice/line';
import { $t } from '#/locales';

import { type FormType, useLineGridColumns } from '../data';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  noticeId: number;
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
  lineFormModalApi.setData({ noticeId: props.noticeId }).open();
}

/** 编辑物料 */
function handleEdit(row: MesWmSalesNoticeLineApi.SalesNoticeLine) {
  lineFormModalApi.setData({ id: row.id, noticeId: props.noticeId }).open();
}

/** 删除物料 */
async function handleDelete(row: MesWmSalesNoticeLineApi.SalesNoticeLine) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.itemName]),
    duration: 0,
  });
  try {
    await deleteSalesNoticeLine(row.id!);
    message.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(isEditable.value),
    height: 400,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.noticeId) {
            return { list: [], total: 0 };
          }
          return await getSalesNoticeLinePage({
            noticeId: props.noticeId,
            pageNo: page.currentPage,
            pageSize: page.pageSize,
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
    },
  } as VxeTableGridOptions<MesWmSalesNoticeLineApi.SalesNoticeLine>,
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
