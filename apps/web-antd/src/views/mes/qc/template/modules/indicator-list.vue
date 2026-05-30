<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MesQcTemplateIndicatorApi } from '#/api/mes/qc/template/indicator';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { ACTION_ICON, TableAction, useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteTemplateIndicator,
  getTemplateIndicatorPage,
} from '#/api/mes/qc/template/indicator';
import { $t } from '#/locales';

import { useIndicatorGridColumns } from '../data';
import IndicatorForm from './indicator-form.vue';

const props = defineProps<{
  readonly?: boolean;
  templateId: number;
}>();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: IndicatorForm,
  destroyOnClose: true,
});

/** 刷新表格 */
function handleRefresh() {
  gridApi.query();
}

/** 创建指标项 */
function handleCreate() {
  formModalApi.setData({ templateId: props.templateId }).open();
}

/** 编辑指标项 */
function handleEdit(row: MesQcTemplateIndicatorApi.TemplateIndicator) {
  formModalApi.setData({ ...row, templateId: props.templateId }).open();
}

/** 删除指标项 */
async function handleDelete(
  row: MesQcTemplateIndicatorApi.TemplateIndicator,
) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.indicatorName]),
    duration: 0,
  });
  try {
    await deleteTemplateIndicator(row.id!);
    message.success(
      $t('ui.actionMessage.deleteSuccess', [row.indicatorName]),
    );
    handleRefresh();
  } finally {
    hideLoading();
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useIndicatorGridColumns(),
    height: 360,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          return await getTemplateIndicatorPage({
            pageNo: page.currentPage,
            pageSize: page.pageSize,
            templateId: props.templateId,
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
  } as VxeTableGridOptions<MesQcTemplateIndicatorApi.TemplateIndicator>,
});
</script>

<template>
  <div>
    <FormModal @success="handleRefresh" />
    <Grid table-title="检测指标项">
      <template v-if="!readonly" #toolbar-tools>
        <TableAction
          :actions="[
            {
              label: '新增指标项',
              type: 'primary',
              icon: ACTION_ICON.ADD,
              auth: ['mes:qc-template:create'],
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
              auth: ['mes:qc-template:update'],
              ifShow: !readonly,
              onClick: handleEdit.bind(null, row),
            },
            {
              label: $t('common.delete'),
              type: 'link',
              danger: true,
              icon: ACTION_ICON.DELETE,
              auth: ['mes:qc-template:update'],
              ifShow: !readonly,
              popConfirm: {
                title: $t('ui.actionMessage.deleteConfirm', [
                  row.indicatorName,
                ]),
                confirm: handleDelete.bind(null, row),
              },
            },
          ]"
        />
      </template>
    </Grid>
  </div>
</template>
