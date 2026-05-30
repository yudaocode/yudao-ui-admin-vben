<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcIndicatorResultApi } from '#/api/mes/qc/indicatorresult';

import { useVbenModal } from '@vben/common-ui';

import { ElLoading, ElMessage } from 'element-plus';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteIndicatorResult,
  getIndicatorResultPage,
} from '#/api/mes/qc/indicatorresult';
import { $t } from '#/locales';

import { useQcIndicatorResultGridColumns } from './data';
import QcIndicatorResultForm from './form.vue';

const props = defineProps<{
  qcId: number;
  qcType: number;
  readonly?: boolean;
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: QcIndicatorResultForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 新增检测结果 */
function handleCreate() {
  formModalApi
    .setData({
      formType: 'create',
      qcId: props.qcId,
      qcType: props.qcType,
    })
    .open();
}

/** 编辑检测结果 */
function handleEdit(row: MesQcIndicatorResultApi.IndicatorResult) {
  formModalApi
    .setData({
      formType: 'update',
      id: row.id,
      qcId: props.qcId,
      qcType: props.qcType,
    })
    .open();
}

/** 删除检测结果 */
async function handleDelete(row: MesQcIndicatorResultApi.IndicatorResult) {
  const loadingInstance = ElLoading.service({
    text: $t('ui.actionMessage.deleting', [row.code]),
  });
  try {
    await deleteIndicatorResult(row.id!);
    ElMessage.success($t('ui.actionMessage.deleteSuccess', [row.code]));
    handleRefresh();
  } finally {
    loadingInstance.close();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useQcIndicatorResultGridColumns(),
    height: 360,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!props.qcId) {
            return { list: [], total: 0 };
          }
          return await getIndicatorResultPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            qcId: props.qcId,
            qcType: props.qcType,
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
  } as VxeTableGridOptions<MesQcIndicatorResultApi.IndicatorResult>,
});
</script>

<template>
  <div>
    <FormModal @success="handleRefresh" />
    <Grid table-title="检测结果">
      <template v-if="!readonly" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增',
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
              ifShow: !readonly,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'danger',
              link: true,
              icon: ACTION_ICON.DELETE,
              ifShow: !readonly,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [row.code]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
