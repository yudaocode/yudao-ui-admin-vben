<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesWmMiscIssueLineApi } from '#/api/mes/wm/miscissue/line';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteMiscIssueLine,
  getMiscIssueLinePage,
} from '#/api/mes/wm/miscissue/line';
import { $t } from '#/locales';

import { type FormType, useLineGridColumns } from '../data';
import LineForm from './line-form.vue';

const props = defineProps<{
  formType: FormType;
  issueId: number;
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
  lineFormModalApi.setData({ issueId: props.issueId }).open();
}

/** 编辑物料 */
function handleEdit(row: MesWmMiscIssueLineApi.MiscIssueLine) {
  lineFormModalApi.setData({ id: row.id, issueId: props.issueId }).open();
}

/** 删除物料 */
async function handleDelete(row: MesWmMiscIssueLineApi.MiscIssueLine) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.itemName]),
  });
  try {
    await deleteMiscIssueLine(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.itemName]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLineGridColumns(isEditable.value),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.issueId) {
            return { list: [], total: 0 };
          }
          return await getMiscIssueLinePage({
            issueId: props.issueId,
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
  } as VxeTableGridOptions<MesWmMiscIssueLineApi.MiscIssueLine>,
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
              type: 'primary',
              link: true,
              icon: ACTION_ICON.EDIT,
              ifShow: isEditable,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
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
